var io = require("./socketConnection");
var co = require("co");
var _ = require("underscore");

//app modules
var data = require("../data");
var utils = require("./utils");

var chess = require("../chess");

//chess game class
function game(white, black, time, increment, rated){
    this.id = "";
    this.rated = rated;

    this.white = {
            _id: white._id,
            name: white.name,
            rating: white.rating,
            socket: null,
            ready: false,
            time: time,
            resign: false
        };

    this.black = {
            _id: black._id,
            name: black.name,
            rating: black.rating,
            socket: null,
            ready: false,
            time: time,
            resign: false
        };

    this.time = time;
    this.increment = increment;

    this.playing = false;
    this.timing = false;

    //timeout for game finalization
    this.currentTimeout = null;
    this.lastMoveTime = null;

    this.chess = new chess.Chess();

    this.spectators = [];

    this.getAdjustedPlayerTime = function(){
        if(!this.timing || this.lastMoveTime == null){
            return { white: this.white.time, black: this.black.time };
        }

        var timeSpent = (Date.now() - this.lastMoveTime) / (60 * 1000);

        if(this.chess.turn() == "w"){
            return { white: this.white.time - timeSpent, black: this.black.time };
        }
        else{
            return { white: this.white.time, black: this.black.time - timeSpent };
        }
    };

    this.isUsernamePlaying = function(username){
        return this.white.name == username || this.black.name == username;
    };

    this.readyUp = function(username, socket){
        if(this.white.name == username){
            this.white.ready = true;
            this.white.socket = socket;
            return;
        }

        if(this.black.name == username){
            this.black.ready = true;
            this.black.socket = socket;
            return;
        }
    };

    this.isGameReady = function(){
        return this.white.ready && this.black.ready;
    };

    this.getColorForUser = function(userId){
        if(this.white._id == userId){
            return "w";
        }

        if(this.black._id == userId){
            return "b";
        }

        return null;
    };

    this.getOpponent = function(username){
        if(this.white.name == username){
            return this.black;
        }

        if(this.black.name == username){
            return this.white;
        }

        return null;
    }

    this.getUsernameForColor = function(color){
        //return the user who's turn it is
        if(color == "w"){
            return this.white;
        }

        if(color == "b"){
            return this.black;
        }

        return null;
    };
}

game.CreateGame = function(white, black, time, increment, rated){
    console.log("createGame " + white + " " + black + " " + time + "+" + increment + " " + rated);

    //TODO: sanity check time, increment? 
    var newGame = new game(white, black, time, increment, rated);

    //generate game id
    var id = utils.generateGameID();
    newGame.id = id;

    //store game in cache
    data.activeGames[id] = newGame;

    return newGame;
}

game.CreateGameRandom = function(p1, p2, time, increment, rated){
    //randomize colors
    var p1IsWhite = Math.random() < 0.5;
    var white = (p1IsWhite)?p1:p2;
    var black = (p1IsWhite)?p2:p1;

    return game.CreateGame(white, black, time, increment, rated);
}

module.exports = game;
