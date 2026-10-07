const { contextBridge, ipcRenderer }=require('electron');
contextBridge.exposeInMainWorld('varga',{
  pickBuild:()=>ipcRenderer.invoke('pick-build'),
  checkTools:()=>ipcRenderer.invoke('check-tools'),
  listAvds:()=>ipcRenderer.invoke('list-avds'),
  startAvd:n=>ipcRenderer.invoke('start-avd',n),
  installBuild:f=>ipcRenderer.invoke('install-build',f),
  screenshot:()=>ipcRenderer.invoke('screenshot')
});