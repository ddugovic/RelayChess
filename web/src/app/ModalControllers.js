angular
    .module("relayApp")
    .controller("seekModalController", function ($scope, close) {
        $scope.setTimeControl = function(time, inc)
        {
            close({time: time, inc: inc});
        };

        $scope.close = close;
    })
    .controller("seekAIModalController", function ($scope, close) {
        $scope.setAILevel = function(level)
        {
            if(level >= 1 && level <= 5){
                close(level);
            }
        };

        $scope.close = close;
    });
