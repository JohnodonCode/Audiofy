const {remote, ipcRenderer} = require('electron');
const fs = require('fs');


global.appdatapath = remote.app.getPath('appData') + '/audiofy';
let config = JSON.parse(fs.readFileSync(global.appdatapath + '/config.json', {encoding: 'utf-8'}));
document.addEventListener('DOMContentLoaded', function(e){
    document.getElementById('close-button').addEventListener('click', function(e){
        remote.getCurrentWindow().hide();
    });
    document.getElementById('inputDir').value = config.dir;
    document.getElementById('openDir').addEventListener('click', function(e){
        ipcRenderer.send('openDir');
    });
    ipcRenderer.on('dialogFinished', function(e, dialog){
        if(dialog.canceled == false) document.getElementById('inputDir').value = dialog.filePaths[0];
        else return;
    });
    document.getElementById('settingsSave').addEventListener('click', function(e){
        let final = {
            "dir": document.getElementById('inputDir').value
        }
        fs.writeFileSync(global.appdatapath + '/config.json', JSON.stringify(final), {encoding: 'utf-8'});
        ipcRenderer.send('refreshMain');
        remote.getCurrentWindow().hide();

    });
});