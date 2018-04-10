var io = require("./socketConnection");
var co = require("co");
var _ = require("underscore");

//app modules
var data = require("../data");
var userToken = require("../userToken");

var utils = require("./utils");

var game = require("./game");

//TODO: check for min/max rating

module.exports = function(socket){
    
    //player submitted new seek
    socket.on("seek", function(request){
        console.log("socket -> seek");

        //validate input
        if(!("time" in request) || !("inc" in request) || 
        !_.isNumber(request.time) || !_.isNumber(request.inc) || 
        request.time < 0 || request.inc < 0 || 
        (request.time == 0 && request.inc == 0)){
            //invalid request
            return;
        }

        if(!("rated" in request) || !_.isBoolean(request.rated)){
            //invalid request
            return;
        }

        var user = utils.getServerUserBySocket(socket);
        
        if(!user){
            //invalid user
            return;    
        }

        if(user.name.startsWith("anonymous") && request.rated){
            //anonymous users cannot seek rated games
            return;
        }

        data.gameSeeks[user.name] = {
            user: user,
            time: request.time, 
            increment: request.inc,
            minRating: 0,
            maxRating: 9999,
            rated: request.rated
        };

        //push updated seeks to all players
        utils.emitSeeksUpdate(io.sockets);
    });

    //player answered seek
    socket.on("answerSeek", function(request){
        console.log("socket -> answerSeek");

        if(!("seek" in request) || !_.isString(request.seek)){
            //invalid request
            return;
        }
        
        var user = utils.getServerUserBySocket(socket);
        
        if(!user){
            //invalid user
            return;    
        }

        if(request.seek in data.gameSeeks){

            //anonymous users can only join unrated games
            if(user.name.startsWith("anonymous") && data.gameSeeks[request.seek].rated){
                return;
            }

            //delete the requested seek
            delete data.gameSeeks[request.seek];

            //push updated seeks to all players
            utils.emitSeeksUpdate(io.sockets);

            //can't join your own seek
            if(user.name == request.seek){
                return;
            }

            //check if other player is still online
            if(!(request.seek in data.loggedInUsers)){
                return;
            }

            //create new game
            var newGame = game.CreateGameRandom(
                request.seek, 
                user.name, 
                data.gameSeeks[request.seek].time, 
                data.gameSeeks[request.seek].increment,
                data.gameSeeks[request.seek].rated);

            //invite players to game
            socket
            .emit("joinGame", {id: newGame.id, orientation: newGame.getColorForUsername(user.name)});
            
            data.loggedInUsers[request.seek].sockets[0]
            .emit("joinGame", {id: newGame.id, orientation: newGame.getColorForUsername(request.seek)});

            //remove potential seek of answering players
            if(user.name in data.gameSeeks){
                delete data.gameSeeks[user.name];

                //push updated seeks to all players
                utils.emitSeeksUpdate(io.sockets);
            }

            //push active games to all users
            utils.emitActiveGames(io.sockets);
        }

    });
};
