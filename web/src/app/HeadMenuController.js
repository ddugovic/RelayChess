angular
    .module("relayApp")
    .controller("headMenuController", function ($rootScope, $scope, $http, $window, $route, $routeParams,
                                                $location, $localStorage, $timeout, ModalService,
                                                relayChess, relayAudio) {
        $scope.relayChess = relayChess;
        $scope.relayAudio = relayAudio;
        $scope.location = $location;

        $scope.showProfile = function(){
            if(relayChess.loggedIn){
                //TODO: profile page
            }
        };

        $scope.login = function(){
            //login page
            $location.path("login");
        };

        $scope.register = function(){
            //register page
            $location.path("register");
        };

        $scope.lobby = function(){
            //lobby page
            $location.path("lobby");
        };

        $scope.logout = function(){
            delete $localStorage.userToken;

            //wait for digest cycle
            $timeout(function(){
                //force page reload
                $window.location.reload();
            },500);
        };

        $scope.toggleMusic = function(){
            relayAudio.muteMusic(!relayAudio.musicMuted);
        };

        $scope.toggleSound = function(){
            relayAudio.muteSound(!relayAudio.soundMuted);
        };
    });
