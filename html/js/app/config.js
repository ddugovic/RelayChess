(function() {
    var app = angular.module("relayApp", ["ngRoute", "ngStorage", "angularModalService", "ngAudio", "ngCookies"]);

    //config our routes
    app.config(function ($routeProvider) {
        $routeProvider.when("/", {
            templateUrl: "lobby.html",
        controller: "lobbyController"
        }).when("/rules", {
            templateUrl: "rules.html",
            controller: "lobbyController"
        }).when("/community", {
            templateUrl: "community.html",
            controller: "lobbyController"
        }).when("/play/:id/:orientation", {
            templateUrl: "play.html",
            controller: "playController"
        }).when("/playAI/:level/:orientation", {
            templateUrl: "playAI.html",
            controller: "playAIController"
        }).otherwise({redirectTo: "/"});
    });
})();
