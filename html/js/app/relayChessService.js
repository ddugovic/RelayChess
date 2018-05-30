(function() {
    var socketServer = "http://localhost:3000/";

    var app = angular.module("relayApp");

    app.factory("relayChess", function ($rootScope, $window, $timeout, $location, $localStorage, $cookies) {
        var data = {
            loggedIn: false,
            anonymousUser: true,
            socket: null,
            playerInfo: {
                username: "Anonymous",
                displayName: "Anonymous"
            },
            users: [],
            seeks: [],
            activeGames: []
        };

        console.log($cookies.getAll());

        var socket = io.connect(socketServer);

        data.socket = socket;

        //update user info
        if($cookies.get(userToken) != undefined && $cookies.get(userToken) != null)
        {
            var userToken = JSON.parse($cookies.get(userToken));

            data.playerInfo.username = userToken.name;
            data.playerInfo.displayName = userToken.displayName;

            data.anonymousUser = false;
        }

        data.login = function(){
            if(data.loggedIn)
            {
                return;
            }

            //login as anonymous if we don't have a token
            if($cookies.get(userToken) == undefined || $cookies.get(userToken) == null)
            {
                //try login as new anonymous user
                data.socket.emit("login", {token: "anonymous"});
                data.anonymousUser = true;

                return;
            }

            var userToken = JSON.parse($cookies.get(userToken));

            //check token
            data.socket.emit("login", {token: userToken});

            //TODO: validate this on server response
            data.loggedIn = true;
            data.anonymousUser = false;
        };

        socket.on("logout", function(response){
            console.log("socket -> logout");

            $rootScope.$apply(function() {
                $cookies.put('userToken', '');

                //wait for digest cycle
                $timeout(function () {
                    $window.location.reload();
                },500);
            });
        });

        socket.on("userUpdate", function(response){
            //store online users
            console.log("socket -> userUpdate");

            $rootScope.$apply(function(){
                data.users = response.users;
            });
        });

        socket.on("anonToken", function(response){
            console.log("socket -> anonToken");

            $rootScope.$apply(function(){
                //store anonymous credentials
                data.playerInfo.username = response.name;
                data.playerInfo.displayName = response.displayName;
                data.anonymousUser = true;
            });
        });

        socket.on("seekUpdate", function(response){
            //store seeks
            console.log("socket -> seekUpdate");

            if(data.anonymousUser){
                //remove rated games for anonymous users
                for (var i = 0; i < response.seeks.length; i++) {
                    if(response.seeks[i].rated){
                        response.seeks.splice(i,1)
                        i--;
                    }
                }
            }

            $rootScope.$apply(function(){
                data.seeks = response.seeks;
            });
        });

        socket.on("activeGameUpdate", function(response){
            //store active games
            console.log("socket -> activeGameUpdate");

            $rootScope.$apply(function(){
                data.activeGames = response.activeGames;
            });
        });

        //chessgame endpoints
        socket.on("joinGame", function(response){
            //move player to game after seek has been accepted etc.
            $rootScope.$apply(function(){
                $location.path("play/" + response.id + "/" + response.orientation);
            });
        });

        socket.on("setupGame", function(response){
            $rootScope.$emit("setupGame", response);
        });

        socket.on("startGame", function(response){
            $rootScope.$emit("startGame", response);
        });

        socket.on("move", function(response){
            $rootScope.$emit("move", response);
        });

        socket.on("gameOver", function(response){
            $rootScope.$emit("gameOver", response);
        });

        socket.on("timeUpdate", function(response){
            $rootScope.$emit("timeUpdate", response);
        });

        return data;
    });
})();
