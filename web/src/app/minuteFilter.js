(function(){
    var app = angular.module("relayApp");

    app.filter("asMinutes", function(){
        return function(input){
            function roundX(number, precision) {
                var factor = Math.pow(10, precision);
                var tempNumber = number * factor;
                var roundedTempNumber = Math.round(tempNumber);
                return roundedTempNumber / factor;
            };

            if(isNaN(input)){
                return input;
            }

            if(input < 0){
                input = 0;
            }

            var minutes = Math.floor(input);
            var totalSeconds = (input - minutes) * 60;

            var seconds = Math.floor(totalSeconds);

            return ("00" + minutes).slice(-2) + ":" + ("00" + seconds).slice(-2);
        };
    });

})();