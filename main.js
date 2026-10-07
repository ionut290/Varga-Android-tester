const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd,args=[]){
  return new Promise((resolve,reject)=>{
    execFile(cmd,args,{windowsHide:true},(err,stdout,stderr)=>{
      if(err) reject(new Error((stderr||err.message).trim()));
      else resolve((stdout||stderr||'OK').trim());
    });
  });
}
function createWindow(){
  const win=new BrowserWindow({
    width:1100,height:760,minWidth:760,minHeight:600,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}
  });
  win.loadFile('index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

ipcMain.handle('pick-build',async()=>{
  const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Android build',extensions:['apk','aab']}]});
  return r.canceled?null:r.filePaths[0];
});
ipcMain.handle('check-tools',async()=>{
  const out={};
  for(const [name,cmd] of [['ADB','adb'],['Emulator','emulator'],['Bundletool','bundletool']]){
    try{out[name]={ok:true,text:await run(cmd,['--version'])};}catch(e){out[name]={ok:false,text:e.message};}
  }
  return out;
});
ipcMain.handle('list-avds',async()=>{
  try{return {ok:true,items:(await run('emulator',['-list-avds'])).split(/\r?\n/).filter(Boolean)};}
  catch(e){return {ok:false,error:e.message,items:[]};}
});
ipcMain.handle('start-avd',async(_,name)=>{
  try{
    const child=spawn('emulator',['-avd',name],{detached:true,stdio:'ignore',windowsHide:true});
    child.unref();
    return {ok:true};
  }catch(e){return {ok:false,error:e.message};}
});
ipcMain.handle('install-build',async(_,file)=>{
  if(!file||!fs.existsSync(file))return {ok:false,error:'File non trovato'};
  if(path.extname(file).toLowerCase()!=='.apk')return {ok:false,error:'Per ora l’installazione diretta richiede APK. Il supporto AAB verrà gestito con bundletool.'};
  try{return {ok:true,text:await run('adb',['install','-r',file])};}catch(e){return {ok:false,error:e.message};}
});
ipcMain.handle('screenshot',async()=>{
  const target=path.join(app.getPath('pictures'),'varga-android-tester-'+Date.now()+'.png');
  try{
    await run('adb',['exec-out','screencap','-p']);
    await new Promise((resolve,reject)=>{
      const p=spawn('adb',['exec-out','screencap','-p']);
      const s=fs.createWriteStream(target); p.stdout.pipe(s);
      p.on('close',c=>c===0?resolve():reject(new Error('Screenshot fallito')));
    });
    return {ok:true,path:target};
  }catch(e){return {ok:false,error:e.message};}
});
