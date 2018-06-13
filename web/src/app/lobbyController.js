angular
    .module("relayApp")
    .controller("lobbyController", function ($rootScope, $scope, $http, $window, $route, $routeParams,
                                             $location, $localStorage, relayChess, ModalService,
                                             relayAudio) {
        $scope.relayChess = relayChess;
        relayAudio.ensureLobbyIsPlaying();

        //login as anonymous or with user token
        relayChess.login();

        $scope.orderUsersComparator = function(a,b)
        {
            if(a == "?")
                return -1;

            if(b == "?")
                return 1;

            return (a.r > b.r) ? 1 : -1;
        };

        $scope.navigate = function(to)
        {
            $location.path(to);
        };

        $scope.answerSeek = function(seek)
        {
            relayChess.socket.emit("answerSeek", {seek: seek});
        };

        $scope.spectateGame = function(game)
        {
            //determine orientation
            var orientation = (relayChess.playerInfo.username == game.black.name)?"b":"w";

            //spectate Game
            $location.path("play/" + game.id + "/" + orientation);
        };

        $scope.openSeekDialog = function()
        {
            relayAudio.playSound("click");

            ModalService.showModal({
                templateUrl: "seekModal.html",
                controller: "seekModalController"
            }).then(function(modal){
                modal.close.then(function(result){
                    if(result)
                    {
                        console.log("new game " + result.time);

                        var rated = !relayChess.anonymousUser;
                        relayChess.socket.emit("seek", {time: result.time, inc: result.inc, rated: rated});

                        //send out seek request
                        //and wait for joinGame message

                        //send seek cancel on controller exit
                    }
                });
            });
        };

        $scope.openSeekAIDialog = function()
        {
            relayAudio.playSound("click");

            ModalService.showModal({
                templateUrl: "seekAIModal.html",
                controller: "seekAIModalController"
            }).then(function(modal){
                modal.close.then(function(result){
                    if(result)
                    {
                        console.log("new ai game " + result);

                        //start AI game
                        $location.path("playAI/" + result + "/w");
                    }
                });
            });
        };

        $scope.openFriendSeekDialog = function()
        {
            ModalService.showModal({
                templateUrl: "seekModal.html",
                controller: "seekModalController"
            }).then(function(modal){
                modal.close.then(function(result){
                    if(result)
                    {
                        console.log("new game " + result.time);
                    }
                });
            });
        };
    });
