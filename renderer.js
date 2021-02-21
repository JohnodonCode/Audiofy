const {remote, ipcRenderer} = require('electron');
const fs = require('fs');
const mm = require('music-metadata');
global.nowplaying = {
    audio: null,
    div: null,
};
global.queue = [];
global.appdatapath = remote.app.getPath('appData') + '\\audiofy';
let config = JSON.parse(fs.readFileSync(global.appdatapath + '/config.json', {encoding: 'utf-8'}));
let songs = [];
if(config.dir) { songs = fs.readdirSync(config.dir); ipcRenderer.send('songSize', songs.length);}
global.config = config;
const win = remote.getCurrentWindow(); /* Note this is different to the
html global `window` variable */

// When document has loaded, initialise
document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

// helper functions
function convertElapsedTime(n) {
    let seconds = Math.floor(n%60);
    if(seconds < 10) seconds = "0"+seconds;
    let minutes = Math.floor(n/60);
    return `${minutes}:${seconds}`;
}



// equalizer div creation
let equalizer = document.createElement('div');
equalizer.innerHTML = `<div class="equalizer"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
<rect class="eq-bar eq-bar--1" x="4" y="4" width="3.7" height="8"/>
<rect class="eq-bar eq-bar--2" x="10.2" y="4" width="3.7" height="16"/>
<rect class="eq-bar eq-bar--3" x="16.3" y="4" width="3.7" height="11"/>
</svg>`
equalizer.classList.add('equalizer');



window.onbeforeunload = (event) => {
    /* If window is reloaded, remove win event listeners
    (DOM element listeners get auto garbage collected but not
    Electron win listeners as the win is not dereferenced unless closed) */
    win.removeAllListeners();
}

function handleWindowControls() {
    // Make minimise/maximise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", event => {
        win.minimize();
    });

    document.getElementById('max-button').addEventListener("click", event => {
        win.maximize();
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        win.unmaximize();
    });

    document.getElementById('close-button').addEventListener("click", event => {
       ipcRenderer.send('close-app');
    });

    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}
document.addEventListener("DOMContentLoaded", async function() {
setInterval(updateProgressValue, 500);

    let pauseplaybtn = document.getElementById('pauseplaybtn');
    let seekerimg = document.getElementById('seekerimg');
    let seekerartist = document.getElementById('seekerartist');
    let seekertitle = document.getElementById('seekertitle');
    let seekerprogress = document.getElementById('seekerprogress');
    let seekerprogresstotal = document.getElementById('seekerprogresstotal');

    let progressBar = document.getElementById('progress')
    pauseplaybtn.src = 'img/play.svg';
    let id = 0;
    let songDiv = document.getElementById('songs');
        songs.forEach(async song=>{
            ipcRenderer.send('songAdded', 1);
            let metadata = await mm.parseFile(config.dir+`/${song}`);
            let image;
            if(metadata.common.picture) {
                let picture = metadata.common.picture[0];
                image = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            } else {
                image = 'img/unknown.svg';
            }
            
            let div = document.createElement('div');
            div.classList.add('song');
            let i = document.createElement('img');
            i.src = image;
            i.classList.add('songImg')
            div.appendChild(i);
            let g = document.createElement('p');
            g.innerHTML = metadata.common.title;
            div.appendChild(g);
            songDiv.appendChild(div);
            div.setAttribute('id', id);
            queue.push({
                id: id,
                div: div
            });
            div.addEventListener('click', function (e) {
                pauseplaybtn.src = 'img/pause.svg';
                seekerimg.src = 'img/unknown.svg';
                seekertitle.innerHTML = 'Unknown Song';
                seekerartist.innerHTML = 'Unknown Artist';
                seekerprogress.innerHTML = '0:00';
                seekerprogresstotal.innerHTML = '0:00';
                if(global.nowplaying.audio != null){global.nowplaying.audio.pause(); global.nowplaying.div.classList.remove('nowplaying');}
                global.nowplaying.audio = new Audio(config.dir+`/${song}`);
                global.nowplaying.audio.play();
                seekerimg.src = image;
                if(metadata.common.title) seekertitle.innerHTML = metadata.common.title;
                if(metadata.common.artist) seekerartist.innerHTML = metadata.common.artist;
                
                global.nowplaying.div = div;
                div.prepend(equalizer);
                div.classList.add('nowplaying');
                global.nowplaying.audio.onended = function() {
                    seekerimg.src = 'img/unknown.svg';
                    seekertitle.innerHTML = 'Unknown Song';
                    seekerartist.innerHTML = 'Unknown Artist';
                    seekerprogress.innerHTML = '0:00';
                    seekerprogresstotal.innerHTML = '0:00';
                    pauseplaybtn.src = 'img/play.svg';
                    global.nowplaying.div.classList.remove('nowplaying');
                    document.getElementById('empty').prepend(equalizer);
                    let currentID = global.nowplaying.div.getAttribute('id');
                    currentID++;
                    global.nowplaying.div = null;
                    global.nowplaying.audio = null;
                    if(songs.length != currentID) document.querySelector(`[id='${currentID}']`).click();
                }
                global.nowplaying.audio.onpause = function () {
                    pauseplaybtn.src = 'img/play.svg';
                }
                global.nowplaying.audio.onplay = function () {
                    pauseplaybtn.src = 'img/pause.svg';
                }
            })
            id++;

       
    });
    document.getElementById('nextbtn').addEventListener('click', function(e){
        if(global.nowplaying.audio == null) return;
        else {
            global.nowplaying.audio.pause();
            seekerimg.src = 'img/unknown.svg';
            seekertitle.innerHTML = 'Unknown Song';
            seekerartist.innerHTML = 'Unknown Artist';
            seekerprogress.innerHTML = '0:00';
            seekerprogresstotal.innerHTML = '0:00';
            pauseplaybtn.src = 'img/play.svg';
            global.nowplaying.div.classList.remove('nowplaying');
            document.getElementById('empty').prepend(equalizer);
            let currentID = global.nowplaying.div.getAttribute('id');
            currentID++;
            global.nowplaying.div = null;
            global.nowplaying.audio = null;
            if(songs.length != currentID) document.querySelector(`[id='${currentID}']`).click();
        }
    });
    document.getElementById('prevbtn').addEventListener('click', function(e){
        if(global.nowplaying.audio == null) return;
        else {
            global.nowplaying.audio.pause();
            seekerimg.src = 'img/unknown.svg';
            seekertitle.innerHTML = 'Unknown Song';
            seekerartist.innerHTML = 'Unknown Artist';
            seekerprogress.innerHTML = '0:00';
            seekerprogresstotal.innerHTML = '0:00';
            pauseplaybtn.src = 'img/play.svg';
            global.nowplaying.div.classList.remove('nowplaying');
            document.getElementById('empty').prepend(equalizer);
            let currentID = global.nowplaying.div.getAttribute('id');
            currentID--;
            global.nowplaying.div = null;
            global.nowplaying.audio = null;
            if(currentID != -1) return document.querySelector(`[id='${currentID}']`).click(); 
        }
    });
    pauseplaybtn.addEventListener('click', function(e) {
        if(global.nowplaying.audio.paused) { global.nowplaying.audio.play(); pauseplaybtn.src = 'img/pause.svg';}
        else { global.nowplaying.audio.pause(); pauseplaybtn.src = 'img/play.svg'; }
    })

    function updateProgressValue() {
        if(global.nowplaying.audio == null || !global.nowplaying.audio) return progressBar.value = 0;
        progressBar.value = global.nowplaying.audio.currentTime;
        progressBar.max = global.nowplaying.audio.duration;
        seekerprogress.innerHTML = convertElapsedTime(global.nowplaying.audio.currentTime);
        seekerprogresstotal.innerHTML = convertElapsedTime(global.nowplaying.audio.duration);
      };
    progressBar.addEventListener('change', function(e){
        if(global.nowplaying.audio !== null) global.nowplaying.audio.currentTime = progressBar.value;
    });
    document.getElementById('settingsBtn').addEventListener('click', function(e){
        ipcRenderer.send('openSettings');
    })



});