const { contextBridge, ipcRenderer }=require('electron');
contextBridge.exposeInMainWorld('varga',{
  pickBuild:()=>ipcRenderer.invoke('pick-build'),
  pickBundletool:()=>ipcRenderer.invoke('pick-bundletool'),
  checkTools:()=>ipcRenderer.invoke('check-tools'),
  listAvds:()=>ipcRenderer.invoke('list-avds'),
  createAvd:c=>ipcRenderer.invoke('create-avd',c),
  startAvd:n=>ipcRenderer.invoke('start-avd',n),
  installBuild:p=>ipcRenderer.invoke('install-build',p),
  detectLaunch:()=>ipcRenderer.invoke('detect-launch'),
  screenshot:()=>ipcRenderer.invoke('screenshot')
});