(function (window, Model) {
    window.request = Model.initialize();
    window.opts = {};
}(window, window.Model));

var ytplayer = "",
    index = -1,
    playlist = [],
    currentTime = '',
    duration = '',
    timerOn = false,
    tVar,
    alsoPlay = false,
    playlistItems = false;

function emptyPlaylist() {
    if (playlist.length === 0) {
        return true;
    }
    return false;
}

// initialize YTPlayer
function onYouTubeIframeAPIReady() {
    ytplayer = new YT.Player('ytplayer', {
        height: '0',
        width: '0',
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function isYTPlayer() {
    if (typeof ytplayer !== 'object') {
        return false;
    } else {
        return true;
    }
}

function startTimer() {
    timerOn = true;
    updateProgressBar();
}

function stopTimer() {
    timerOn = false;
    clearTimeout(tVar);
}

function mmss(sec) {
    var min = sec / 60 | 0,
        seconds = (sec - min * 60) | 0;

    if (min < 10) {
        min = "0" + min;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = min + ":" + seconds;
    return time;
}

function initjPlayer(track) {
    $('.jp-title').html(track);
    $(".jp-play-bar").width('0%');

    $(".jp-play").css({ display: 'none' });
    $(".jp-pause").css({ display: 'inline-block' });
    duration.html(mmss(ytplayer.getDuration()));
}

function stopjPlayer() {
    $('.jp-title').html("");
    $(".jp-play-bar").width('0%');

    $(".jp-current-time").html("00:00");
    duration.html("00:00");
    $(".jp-play").css({ display: 'inline-block' });
    $(".jp-pause").css({ display: 'none' });       
}

function updateProgressBar() {
    if (!isYTPlayer()) {
        return false;
    }

    if (!timerOn) {
        return false;
    }
    var cTime = ytplayer.getCurrentTime(),
        dur = ytplayer.getDuration(),
        pos = (cTime * 100) / dur;

    currentTime.html(mmss(cTime));
    duration.html(mmss(dur));
    $(".jp-play-bar").width(pos + "%");

    tVar = setTimeout(function () {
        updateProgressBar()
    }, 500);
}

/** Starts the player **/
function startPlayback(id) {
    ytplayer.loadVideoById(id, 0, "small");
    ytplayer.setPlaybackQuality("small");
    ytplayer.playVideo();
}

/** Play the Given track **/
function playThis(track, id) {
    if (!isYTPlayer()) {
        return false;
    }

    if (emptyPlaylist()) {
        return false;
    }

    // check if current track is the playing track
    while (playlist[index].yid != id) {
        ++index;    // find the index of current playing track
        if (playlist.length == index) {
            index = 0;
        }
    }

    startPlayback(id);
    startTimer();
    initjPlayer(track);
}

/** Add Track to the playlist **/
function addToPlaylist(track, artist, mbid, yid) {
    var inPlaylist = false,
        i = playlist.length;

    playlistItems.removeClass('hide');

    if (playlist.length == 0) {
        index = 0;
        playThis(track, yid);
    } else {
        playlist.forEach(function (current, index) {
            if (playlist[index].yid == yid) {
                inPlaylist = true;
                return false;
            }
        });
    }

    if (!inPlaylist) {
        playlist.push({
            mbid: mbid,
            yid: yid,
            track: track,
            artist: artist
        });

        
        playlistItems.append(
            '<div class="list-group-item"><a href="#" data-index="'+i+'" class="pull-right btn-remove item removeThisTrack"><i class="fa fa-times text"></i></a><a href="#" data-track="'+track+'" data-artist="'+artist+'" data-index="'+i+'" data-mbid="'+mbid+'" data-yid="'+yid+'" class="playThisTrack"><i class="icon-control-play text"></i></a><span class="btn-track-info trackInfo"> '+track+'</span><br/><span class="artistInfo text-muted btn-artist-info"> '+artist+'</span></div>'
        );

        $('#playlist-empty-banner').addClass('hide');
        $("#clearPlaylist").removeClass('hide');
    }
}

/** Play next song **/
function playNextSong() {
    if (emptyPlaylist()) {
        stopTimer();
        stopjPlayer();
        return false;
    }

    stopTimer();
    ++index; // Increment the index of current track in playlist

    if (playlist.length == index) { // end of playlist
        index = 0; // play from start
    }
    playThis(playlist[index].track, playlist[index].yid);
}

/** Play previous song **/
function playPrevSong() {
    if (emptyPlaylist()) {
        return false;
    }

    stopTimer();
    --index;

    if (index <= -1) {
        index = 0;  // checking of out of bounds
    }
    playThis(playlist[index].track, playlist[index].yid);
}

/** Seek the player to given seconds **/
function seekTo(sec) {
    if (ytplayer.getPlayerState() == -1) {
        return false;
    }
    ytplayer.seekTo(sec, true);
}

$(document).ready(function () {
    duration = $(".jp-duration");
    currentTime = $(".jp-current-time");
    $(".jp-play-bar").width("0%");
    playlistItems = $("#playlist-items");

    // Adding a song to playlist
    $(".addToPlaylist").on("click", function () {
        var track = $(this).attr("data-track"),
            self = $(this),
            yid = $(this).attr("data-yid"),
            artist = $(this).attr("data-artist"),
            mbid = $(this).attr("data-mbid");

        alsoPlay = false;
        if (yid === undefined) {
            findSong(track, artist, mbid, self);    
        } else {
            addToPlaylist(track, artist, mbid, yid);
        }
        
    });

    // playing a song
    $(".playThisTrack").on("click", function (e) {
        e.preventDefault();
        var track = $(this).attr("data-track"),
            self = $(this),
            yid = $(this).attr("data-yid"),
            artist = $(this).attr("data-artist"),
            mbid = $(this).attr("data-mbid");

        alsoPlay = true;
        if (yid === undefined) {
            findSong(track, artist, mbid, self);    
        } else {
            playThis(track, yid);
        }
        
    });

    // clearing the playlist
    $("#clearPlaylist").on("click", function () {
        if (emptyPlaylist()) {
            return false;
        }
        clearPlaylist();
    });

    $(".removeThisTrack").on("click", function (e) {
        e.preventDefault();
        var index = $(this).attr("data-index");

        removeTrack(index);
    });

    $("#savePlaylist").on("click", function () {
        if (emptyPlaylist()) {
            return false;
        }
        savePlaylist();
    });

    // Find Artist/Track Info
    $(".artistInfo").on("click", function (e) {
        e.preventDefault();

        // to be implemented
    });

    $(".trackInfo").on("click", function (e) {
        e.preventDefault();

        // to be implemented
    });

    /****** Player controls *********/
    // Play/pause
    $(".jp-play").on("click", function () {
        if (emptyPlaylist()) {
            return false;
        }

        ytplayer.playVideo();
        startTimer();

        $(this).css({
            display: 'none'
        });
        $(".jp-pause").css({
            display: 'inline-block'
        });
        
    });
    $(".jp-pause").on("click", function () {
        $(this).css({
            display: 'none'
        });
        $(".jp-play").css({
            display: 'inline-block'
        });
        ytplayer.pauseVideo();
    });

    // Volume Controls = Mute/Unmute
    $(".jp-mute").on("click", function () {
        if (emptyPlaylist()) {
            return false;
        }

        $(this).css({
            display: 'none'
        });
        $(".jp-unmute").css({
            display: 'inline-block'
        });
        ytplayer.setVolume(0);
    });
    $(".jp-unmute").on("click", function () {
        if (emptyPlaylist()) {
            return false;
        }

        $(this).css({
            display: 'none'
        });
        $(".jp-mute").css({
            display: 'inline-block'
        });
        ytplayer.setVolume(100);
    });

    // Previous/Next button
    $(".jp-next").on("click", function () {
        playNextSong();
    });
    $(".jp-previous").on("click", function () {
        playPrevSong();
    });

    // Seek bar
    $('.jp-progress').on("click", function (e) {
        console.log(e);
        // var parentOffset = $(this).parent().offset();
        // var relX = e.pageX - parentOffset.left;
        // var pos  = (100 * relX)/($(this).width());
        
        // if(pos <0) pos = 0;
        // if(pos >100) pos = 100;
        
        // $(".jp-play-bar" ).width(pos+"%");

        // var size = $(".jp-play-bar").width();
        // var pos = (size/100)*(ytplayer.getDuration());
        // // console.log(size);
        // // console.log(pos);
        // // console.log("Seeking ytplayer");
        // seekTo(pos);
    });

});

function onPlayerStateChange(event) {
    var state = event.data;

    if (state == YT.PlayerState.ENDED) {
        playNextSong();
    }

    if (state == YT.PlayerState.PLAYING) {}

    if (state == YT.PlayerState.PAUSED) {
        stopTimer();
    }

    if (state == YT.PlayerState.BUFFERING) {
        // show some buffering modal
    }
    if (state == YT.PlayerState.CUED) {}
}

function findSong(track, artist, mbid, selector) {
    request.create({
        action: '/home/findTrack',
        data: {action: 'findTrack', track: track, artist: artist},
        callback: function (data) {
            if (data != "Error") {
                addToPlaylist(track, artist, mbid, data);
                selector.attr("data-yid", data);
                if (alsoPlay) {
                    playThis(track, data);
                }
            }
        }
    });    
}

function savePlaylist() {
    request.create({
        action: '/users/savePlaylist',
        data: {action: 'savePlaylist', playlist: playlist},
        callback: function (data) {
            if (data.success) {
                // alert the user
                alert('Your playlist has been saved');
            }
        }
    });
}

function clearPlaylist() {
    $('#playlist-empty-banner').removeClass('hide');
    $('#clearPlaylist').addClass('hide');
    $('#playlist-items').html("").addClass('hide');
    playlist = [];
    index = -1;
}

function removeTrack(index) {
    var item = playlistItems.find('a[data-index="'+index+'"][class="removeThisTrack"]');
        item.parent().remove();
    playlist.splice(index, 1);
    return true;
}