require('dotenv').config();
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-web-security');
global.appdatapath = app.getPath('appData') + '/audiofy';
if(!fs.existsSync(global.appdatapath + '/config.json')) fs.writeFileSync(global.appdatapath + '/config.json', JSON.stringify({"dir":""}), {encoding: 'utf-8'});




let loading;
let settings;
let main;
app.on('ready', ()=>{
  loading = new BrowserWindow({width: 375, height: 500, frame: false, webPreferences: {nodeIntegration:true,enableRemoteModule:true}});
  settings = new BrowserWindow({width: 375, height: 500, frame: false, webPreferences: {nodeIntegration:true,enableRemoteModule:true}, show: false});

  loading.loadFile('loading.html');
  settings.loadFile('settings.html');
  
  main = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false,
    },
    show: false,
  });
  main.loadFile('index.html')
  main.webContents.once('dom-ready', () => {
    setTimeout(()=>{
      main.show();
      loading.hide();
    }, 3000);
  });
  
});
ipcMain.on('songSize', (e, n)=>{
  loading.webContents.send('songSize', n);
});
ipcMain.on('songAdded', (e, n)=>{
  loading.webContents.send('songAdded', 1);
});
ipcMain.on('close-app', (e)=>{
  app.quit();
});
ipcMain.on('openSettings', (e)=>{
  if(settings.isVisible()) return;
  else settings.show();
});
ipcMain.on('refreshMain', (e)=>{
  return main.reload();
});
ipcMain.on('openDir', async (e)=>{
  var path = await dialog.showOpenDialog({
    properties: ['openDirectory']
});
settings.webContents.send('dialogFinished', path);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})