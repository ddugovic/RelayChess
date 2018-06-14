angular
    .module("relayApp")
    .filter("asGlicko2", function(){
        return function(input){
            return input == null ? null : Math.round(input.r) + " ± " + Math.round(input.rd*2);
        };
    });
