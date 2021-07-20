//music items
var musicHideItems = ['songalbumArt', 'playmusichide', 'nextmusichide', 'prevmusichide', 'boxCircleAutoHideOne', 'boxCircleAutoHideTwo', 'boxCircleAutoHideThree', 'boxCircleAutoHideFour', 'boxCircleAutoHideFive', 'boxCircleAutoHideSix', 'boxAutoHideOne', 'boxAutoHideTwo', 'boxAutoHideThree', 'boxAutoHideFour', 'boxAutoHideFive', 'boxAutoHideSix'];
var musicDisplay = "block";

function setDiv(id, value, bg) {
    var arworkPreload;
    if (document.getElementById(id)) {
        if (bg) {
            artworkPreload = new Image();
            artworkPreload.onload = function() {
                document.getElementById(id).style.backgroundImage = "url(" + this.src + ")";
                artworkPreload = null;
            };
            artworkPreload.src = "/var/mobile/Library/LockPlus/Artwork.jpg?" + (new Date()).getTime();
        } else {
            document.getElementById(id).innerHTML = value;
        }
    }
}
function setWidthForBar(percent, element){
    var calc;
    var fullWidth = action.savedElements.placedElements['durationbar']["width"];
    fullWidth = fullWidth.replace('px', '');
    calc = Math.round((percent / 100) * fullWidth);
    if (element.style.width != calc + "px") {
        element.style.width = calc + "px";
    }
}
function getPercent(percentFor,percentOf){
    return Math.floor(percentFor/percentOf*100);
}
function timeToSplit(time){
    var piece = String(time).split(':');
    return obj = {
        minute: Number(piece[0]),
        second: Number(piece[1])
    }
}
function getTimeFromScreenDim(oldCurrent){
    var secondsFromScreenDim, minutes, seconds, timeObj;
    secondsFromScreenDim = (screenOnTime - screenOffTime) / 1000;
    minutes = Math.floor(secondsFromScreenDim / 60);
    seconds = minutes % 60;
    timeObj = timeToSplit(oldCurrent);
    return minutes + timeObj.minute + ":" + seconds + timeObj.second;
}
// injectedMusic.isPlaying = true;
// injectedMusic.elapsed = "0:00";
var globalElapsed = null;
var cachedDuration = null;


function runMusicAnimation(key){
    if(!musicAnimationRan[key]){
        musicAnimationRan[key] = true;
        var targ = document.getElementById(key);
        targ.target = {};
        targ.target.id = key;
        checkIfActionNeedsCalled(targ);
    }
}  

function stopMusicAnimation(item){
    document.getElementById(item).style['-webkit-animation'] = null;
    if(musicAnimationRan[item]){
        musicAnimationRan = {};
        runMusicAnimation(item);
        musicAnimationRan = {};
    }    
}

function updateWhenPlayingElements(){
    var obj = action.savedElements.placedElements;
    if(!obj){
        return;
    }
    if(injectedMusic.isPlaying){
        Object.keys(obj).forEach(function(key){
            if (obj[key]["musicplaying"] != null) {
                runMusicAnimation(key);
            }
        });
    }else{
        Object.keys(obj).forEach(function(key){
            if(key != 'pressActions'){
                if(obj[key]['musicplaying']){
                    stopMusicAnimation(key);
                    setTimeout(function(){
                        document.getElementById(key).style['-webkit-animation'] = null;
                    },0);
                }
            }
        });
    }
}

function updateMusicElements() {
    updateWhenPlayingElements();
    var durationBar = document.getElementById('durationbar');
    if (injectedMusic.isPlaying) {
        setDiv('playmusic', 'u', false);
        setDiv('nextmusic', 'y', false);
        setDiv('prevmusic', 'x', false);
        setDiv('playmusichide', 'u', false);
        setDiv('nextmusichide', 'y', false);
        setDiv('prevmusichide', 'x', false);
        setDiv('songtitle', injectedMusic.title, false);
        setDiv('songartist', injectedMusic.artist, false);
        setDiv('songalbum', injectedMusic.album, false);
        setDiv('songtitlenohide', injectedMusic.title, false);
        setDiv('songartistnohide', injectedMusic.artist, false);
        setDiv('songalbumnohide', injectedMusic.album, false);
        setDiv('duration', injectedMusic.duration, false);
        setDiv('elapsed', injectedMusic.elapsed, false);
        
        /* 
            Making sure whenever iOS wants to update elapsed I grab the updated one. 
            Cache duration to see if a song changes
            If a song is paused a reset isn't needed
        */
        if(cachedDuration != injectedMusic.duration || !globalElapsed){
            globalElapsed = injectedMusic.elapsed;
            cachedDuration = injectedMusic.duration;
            screenOffTime = null;
        }

        Looper.removeTimerByName('elapsed');
        Looper.create({
            name: 'elapsed',
            refreshTime: 1000,
            initialTime: 0,
            success: function() {
                var current = injectedMusic.elapsed,
                    piece = null,
                    percentOfDuration = null,
                    m = null,
                    s = null;

                if(Number(injectedMusic.elapsed.replace(':', '')) < Number(globalElapsed.replace(':',''))){
                    current = globalElapsed;
                }

                /* 
                    LockPlus stops all loops when screen dims 
                    It saves the time it stopped them in loopStopTime
                */
               
                if(screenOffTime){
                    current = getTimeFromScreenDim(current);
                    setDiv('elapsed', injectedMusic.elapsed, false);
                    screenOffTime = null;
                }
                
                piece = timeToSplit(current);
                m = piece.minute;
                s = piece.second;
                
                if(s + 1 >= 59){
                    m = m + 1;
                    s = 00;
                }else{
                    s = s + 1;
                }

                if(s < 10){
                    s = "0" + s;
                }

                globalElapsed = m + ":" + s;
                setDiv('elapsed', m + ":" + s, false);

                injectedMusic.elapsedSec = Number((Number(m) * Number(60) + Number(s)));

                percentOfDuration = getPercent(injectedMusic.elapsedSec, injectedMusic.durationSec);

                if(durationBar){
                    setWidthForBar(percentOfDuration, durationBar);
                }

                if(durationProgress){
                    if(durationProgress){
                        if(durationProgress.value != percentOfDuration){
                            durationProgress.value = percentOfDuration;
                        }
                    }
                }
            }
        });
        setDiv('songalbumArt', 'url("/var/mobile/Library/LockPlus/Artwork.jpg?' + new Date().getMilliseconds() + '")', true);
        setDiv('songalbumArtnohide', 'url("/var/mobile/Library/LockPlus/Artwork.jpg?' + new Date().getMilliseconds() + '")', true);
        musicDisplay = "block";
    } else {
        musicDisplay = "none";
        Looper.removeTimerByName('elapsed');
        setDiv('playmusic', 'r', false);
        setDiv('nextmusic', 'y', false);
        setDiv('prevmusic', 'x', false);
        setDiv('playmusichide', 'u', false);
        setDiv('nextmusichide', 'y', false);
        setDiv('prevmusichide', 'x', false);
        setDiv('songtitle', '', false);
        setDiv('songartist', '', false);
        setDiv('songalbum', '', false);
        setDiv('duration', injectedMusic.duration || '0:00', false);
        setDiv('elapsed', injectedMusic.elapsed || '0:00', false);
        setDiv('songalbumArt', 'url("")', true);
        if(durationBar){
            if(!injectedMusic.elapsedSec || Number(injectedMusic.elapsedSec) <= 0){
                setWidthForBar(0, durationBar);
            }
        }
    }
    for (var i = 0; i < musicHideItems.length; i++) {
        if (document.getElementById(musicHideItems[i])) {
            document.getElementById(musicHideItems[i]).style.display = musicDisplay;
        }
    }
}

setTimeout(function() {
    updateMusicElements();
}, 400);
