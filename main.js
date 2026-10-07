const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function run(cmd,args=[],opts={}){
  return new Promise((resolve,reject)=>{
    execFile(cmd,args,{windowsHide:true,maxBuffer:20*1024*1024,...opts},(err,stdout,stderr)=>{
      if(err) reject(new Error((stderr||stdout||err.message).trim()));
      else resolve((stdout||stderr||'OK').trim());
    });
  });
}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}
async function adbReady(){
  await run('adb',['wait-for-device']);
  for(let i=0;i<90;i++){
    try{if((await run('adb',['shell','getprop','sys.boot_completed'])).trim()==='1')return true;}catch{}
    await delay(2000);
  }
  throw new Error('Android non ha completato l’avvio entro 3 minuti.');
}
function createWindow(){
  const win=new BrowserWindow({width:1120,height:820,minWidth:780,minHeight:620,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
  win.loadFile('index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

ipcMain.handle('pick-build',async()=>{
  const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Android build',extensions:['apk','aab']}]});
  return r.canceled?null:r.filePaths[0];
});
ipcMain.handle('pick-bundletool',async()=>{
  const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'bundletool JAR',extensions:['jar']}]});
  return r.canceled?null:r.filePaths[0];
});
ipcMain.handle('check-tools',async()=>{
  const checks=[['ADB','adb',['version']],['Emulator','emulator',['-version']],['Java','java',['-version']],['SDK Manager','sdkmanager',['--version']],['AVD Manager','avdmanager',['list','avd']]];
  const out={};
  for(const [name,cmd,args] of checks){try{out[name]={ok:true,text:await run(cmd,args)};}catch(e){out[name]={ok:false,text:e.message};}}
  return out;
});
ipcMain.handle('list-avds',async()=>{
  try{return {ok:true,items:(await run('emulator',['-list-avds'])).split(/\r?\n/).filter(Boolean)};}
  catch(e){return {ok:false,error:e.message,items:[]};}
});
ipcMain.handle('create-avd',async(_,cfg={})=>{
  const name=(cfg.name||'Varga_Pixel_7').replace(/[^A-Za-z0-9_.-]/g,'_');
  const api=String(cfg.api||35).replace(/\D/g,'')||'35';
  const image=`system-images;android-${api};google_apis;x86_64`;
  try{
    await run('sdkmanager',['--install','platform-tools','emulator',image]);
    await run('avdmanager',['create','avd','-n',name,'-k',image,'-d','pixel_7','--force'],{input:'no\n'});
    return {ok:true,name};
  }catch(e){
    try{
      await new Promise((resolve,reject)=>{
        const p=spawn('avdmanager',['create','avd','-n',name,'-k',image,'-d','pixel_7','--force'],{windowsHide:true});
        let err=''; p.stderr.on('data',d=>err+=d); p.stdin.write('no\n'); p.stdin.end();
        p.on('close',c=>c===0?resolve():reject(new Error(err||'Creazione AVD fallita')));
      });
      return {ok:true,name};
    }catch(e2){return {ok:false,error:e2.message||e.message};}
  }
});
ipcMain.handle('start-avd',async(_,name)=>{
  try{
    const child=spawn('emulator',['-avd',name,'-no-snapshot-save'],{detached:true,stdio:'ignore',windowsHide:true});
    child.unref(); await adbReady();
    return {ok:true};
  }catch(e){return {ok:false,error:e.message};}
});
ipcMain.handle('install-build',async(_,payload={})=>{
  const file=payload.file, bundletool=payload.bundletool;
  if(!file||!fs.existsSync(file))return {ok:false,error:'File build non trovato.'};
  try{
    await adbReady();
    const ext=path.extname(file).toLowerCase();
    if(ext==='.apk'){
      const text=await run('adb',['install','-r',file]);
      return {ok:true,text,kind:'apk'};
    }
    if(ext==='.aab'){
      if(!bundletool||!fs.existsSync(bundletool))return {ok:false,error:'Per installare un AAB seleziona prima bundletool.jar.'};
      const apks=path.join(os.tmpdir(),`varga-${Date.now()}.apks`);
      await run('java',['-jar',bundletool,'build-apks','--bundle='+file,'--output='+apks,'--mode=universal','--overwrite']);
      await run('java',['-jar',bundletool,'install-apks','--apks='+apks]);
      try{fs.unlinkSync(apks);}catch{}
      return {ok:true,text:'AAB convertito e installato correttamente.',kind:'aab'};
    }
    return {ok:false,error:'Formato non supportato.'};
  }catch(e){return {ok:false,error:e.message};}
});
ipcMain.handle('detect-launch',async()=>{
  try{
    await adbReady();
    const thirdParty=await run('adb',['shell','pm','list','packages','-3']);
    const packages=thirdParty.split(/\r?\n/).map(x=>x.replace(/^package:/,'').trim()).filter(Boolean);
    if(!packages.length)return {ok:false,error:'Nessuna app utente trovata nel dispositivo.'};
    const pkg=packages[packages.length-1];
    const out=await run('adb',['shell','monkey','-p',pkg,'-c','android.intent.category.LAUNCHER','1']);
    return {ok:true,package:pkg,text:out};
  }catch(e){return {ok:false,error:e.message};}
});
ipcMain.handle('screenshot',async()=>{
  const target=path.join(app.getPath('pictures'),'varga-android-tester-'+Date.now()+'.png');
  try{
    await adbReady();
    await new Promise((resolve,reject)=>{
      const p=spawn('adb',['exec-out','screencap','-p']); const s=fs.createWriteStream(target);
      p.stdout.pipe(s); p.stderr.on('data',()=>{});
      p.on('close',c=>c===0?resolve():reject(new Error('Screenshot fallito')));
    });
    return {ok:true,path:target};
  }catch(e){return {ok:false,error:e.message};}
});