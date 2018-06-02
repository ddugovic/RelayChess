(function(){
    var app = angular.module("relayApp");

    app.filter("asGlicko2", function(){
        return function(input){
            return input == null ? null : Math.round(input.r) + " ± " + Math.round(input.rd*2);
        };
    });

})();
