(function() {
    var app = angular.module("relayApp");

    app.factory("relayAudio", function ($rootScope, $location, $localStorage, ngAudio) {

        //load sounds
        var sounds = {
            capture: ngAudio.load("sound/standard/Capture.ogg"),
            castle: ngAudio.load("sound/orchestra/Castle.wav"),
            challenge: ngAudio.load("sound/sfx/NewChallenge.ogg"),
            check: ngAudio.load("sound/robot/Check.ogg"),
            click: ngAudio.load("sound/sfx/Berserk.ogg"),
            defeat: ngAudio.load("sound/orchestra/Defeat.wav"),
            draw: ngAudio.load("sound/orchestra/Draw.wav"),
            lobby: ngAudio.load("sound/orchestra/Lobby.mp3"),
            lowtime: ngAudio.load("sound/standard/LowTime.ogg"),
            move: ngAudio.load("sound/standard/Move.ogg"),
            newgame: ngAudio.load("sound/orchestra/NewGame.wav"),
            notify: ngAudio.load("sound/standard/GenericNotify.ogg"),
            theme: ngAudio.load("sound/orchestra/Theme.wav"),
            victory: ngAudio.load("sound/orchestra/Victory.wav")
        };

        function audioService(){ }

        audioService.volume = 0.5;

        audioService.soundMuted = $localStorage.soundMuted;
        audioService.musicMuted = $localStorage.musicMuted;

        audioService.playSound = function(sound){
            if(audioService.soundMuted)
                return;

            if(sound in sounds){
                sounds[sound].volume = audioService.volume;
                sounds[sound].play();
            }
        };

        audioService.ensureLobbyIsNotPlaying = function(){
            sounds["lobby"].loop = false;
        };

        audioService.ensureLobbyIsPlaying = function(){
            if (! sounds["lobby"].loop) {
                sounds["lobby"].loop = true;
                sounds["lobby"].volume = audioService.volume;

                if(audioService.musicMuted){
                    sounds["lobby"].volume = 0;
                }

                sounds["lobby"].play();
            }
        };

        audioService.muteMusic = function(muted){
            audioService.musicMuted = muted;
            $localStorage.musicMuted = muted;

            if(audioService.musicMuted){
                sounds["lobby"].volume = 0;
            }
            else
            {
                sounds["lobby"].volume = audioService.volume;
            }
        };

        audioService.muteSound = function(muted){
            audioService.soundMuted = muted;
            $localStorage.soundMuted = muted;
        };

        return audioService;
    });
})();
