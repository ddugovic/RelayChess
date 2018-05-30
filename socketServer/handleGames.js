var io = require("./socketConnection");
var co = require("co");
var glicko2 = require("glicko2-lite");
var _ = require("underscore");

//app modules
var data = require("../data");
var userToken = require("../userToken");

var utils = require("./utils");

//TODO: unrated games

module.exports = function(socket){
    function abortGame(game){
        console.log("game aborted (" + game.id + ")");
        
        var result = {id: game.id, result: "abort"};

        //notify players
        game.white.socket.emit("gameOver", result);
        game.black.socket.emit("gameOver", result);

        //notify spectators
        utils.emitSpectators(game, "gameOver", result);

        //remove game
        delete data.activeGames[game.id];

        //send active game list to all connected users
        utils.emitActiveGames(io.sockets);
    }

    function gameOver(game){
        //notify both players (and spectators) of the game results, calculate new ratings (if rated) and store game results in database
        var result = null;

        if(game.chess.game_over())
        {
            if(game.chess.in_checkmate()){
                result = {result: "checkmate", winner: game.chess.turn()=="w"?"b":"w"};
            }else if(game.chess.in_draw()){
                if(game.chess.in_stalemate()){
                    result = {result: "draw", reason:"stalemate"};
                }else if(game.chess.in_threefold_repetition()){
                    result = {result: "draw", reason:"repetition"};
                }else if(game.chess.insufficient_material()){
                    result = {result: "draw", reason:"material"};
                }else{
                    result = {result: "draw", reason:"50 moves"};
                }
            }
        }else{
            //check if either player ran out of time
            if(game.white.time <= 0){
                game.white.time = 0;

                if(game.chess.has_mating_material("b")){
                    result = {result: "timeout", winner: "b"};
                }else{
                    result = {result: "draw", reason:"timeout"};
                }
            }else if(game.black.time <= 0){
                game.black.time = 0;

                if(game.chess.has_mating_material("w")){
                    result = {result: "timeout", winner: "w"};
                }else{
                    result = {result: "draw", reason:"timeout"};
                }
            }

            //check if player resigned
            if(game.white.resign){
                result = {result: "resign", winner: "b"};
            }else if(game.black.resign){
                result = {result: "resign", winner: "w"};
            }
        }
        
        if(result){
            //game ended
            console.log("game ended (" + game.id + ")");

            result.id = game.id;

            //remove game
            clearTimeout(game.currentTimeout);
            delete data.activeGames[game.id];

            //send active game list to all connected users
            utils.emitActiveGames(io.sockets);

            var nResult = 0;

            if(result.result == "draw"){
                //draw
                nResult = 0.5;
            }else{
                //decisive
                if(result.winner == "w"){
                    nResult = 1;
                }else{
                    nResult = 0;
                }
            }

            co(function*(){
                if(game.rated){
                    //update player ratings
                    var playerWhite = yield data.userCollection.findOne({_id: game.white._id});
                    var playerBlack = yield data.userCollection.findOne({_id: game.black._id});

                    var ratingWhite = playerWhite.rating;
                    var ratingBlack = playerBlack.rating;

                    var newRatings = {
                        white: glicko2(ratingWhite.r, ratingWhite.rd, ratingWhite.vol, [[ratingBlack.r, ratingBlack.rd, nResult]]),
                        black: glicko2(ratingBlack.r, ratingBlack.rd, ratingBlack.vol, [[ratingWhite.r, ratingWhite.rd, 1-nResult]])
                    };
                    var adjustedRatings = {
                        white: {r:newRatings.white.rating, rd:newRatings.white.rd, vol:newRatings.white.vol},
                        black: {r:newRatings.black.rating, rd:newRatings.black.rd, vol:newRatings.black.vol}
                    };

                    //update user db 
                    yield data.userCollection.update({_id:playerWhite._id}, {$set:{rating:adjustedRatings.white}});
                    yield data.userCollection.update({_id:playerBlack._id}, {$set:{rating:adjustedRatings.black}});

                    result.preRatings = { white: ratingWhite, black: ratingBlack };
                    result.ratings = adjustedRatings;

                    //update server users
                    if(playerWhite._id in data.loggedInUsers)
                        data.loggedInUsers[playerWhite._id].rating = adjustedRatings.white;

                    if(playerBlack._id in data.loggedInUsers)
                        data.loggedInUsers[playerBlack._id].rating = adjustedRatings.black;

                    //send updated player rating to all users
                    utils.emitUserUpdate(io.sockets);
                }

                //send results
                try{
                    game.white.socket.emit("gameOver", result);
                }catch(ex){ }

                try{
                    game.black.socket.emit("gameOver", result);
                }catch(ex){ }

                //notify spectators
                utils.emitSpectators(game, "gameOver", result);

                //store game
                var newGame = {
                    id: game.id,
                    rated: game.rated,
                    time: game.time,
                    increment: game.increment,

                    white: game.white.name,
                    black: game.black.name,
                    result: result,
                    
                    pgn: game.chess.pgn(),
                    finalPosition: game.chess.fen()
                };

                yield data.gameCollection.insertOne(newGame);
            });
        }
    }

    //player joined the game 
    socket.on("joinedGame", function(request){
        console.log("socket -> joinedGame");

        if(!("id" in request) || !_.isString(request.id)){
            //invalid request
            return;
        }

        //look for game with id and verify that user is playing in the game
        var game = data.activeGames[request.id];

        if(!game){
            //invalid id
            return;
        }

        var user = utils.getServerUserBySocket(socket);

        if(!user){
            //invalid user
            return;
        }

        co(function*(){
            //get player details from db
            var whitePlayer = game.white;
            var blackPlayer = game.black;

            var updatedTime = game.getAdjustedPlayerTime();

            //check if player is playing or spectating
            var color = game.getColorForUser(user._id);

            if(!color){
                //user not playing in this game
                //add user as a spectator and reference their socket
                //currently it is not possible to un-spectate
                game.spectators[user._id] = socket;

                socket.emit("setupGame", {
                    id: game.id,
                    spectate: true,
                    orientation: "w", //spectators see white by default
                    history: game.chess.history(),
                    timing: game.timing,
                    white: {
                        title: whitePlayer.title,
                        displayName: whitePlayer.name,
                        rating: whitePlayer.rating,
                        time: updatedTime.white
                    },
                    black: {
                        title: blackPlayer.title,
                        displayName: blackPlayer.name,
                        rating: blackPlayer.rating,
                        time: updatedTime.black
                    }
                });

                return;
            }

            //send configuration to user (board position, color, opponent, clocks, etc.)
            console.log("socket -> setupGame");

            socket.emit("setupGame", {
                id: game.id,
                orientation: color,
                history: game.chess.history(),
                timing: game.timing,
                white: {
                    title: whitePlayer.title,
                    displayName: whitePlayer.name,
                    rating: whitePlayer.rating,
                    time: updatedTime.white
                },
                black: {
                    title: blackPlayer.title,
                    displayName: blackPlayer.name,
                    rating: blackPlayer.rating,
                    time: updatedTime.black
                }
            });

            //set user ready 
            game.readyUp(user.name, socket);

            if(!game.playing && game.isGameReady()){
                console.log("game started (" + request.id + ")");
                //both players have readied up
                //lets start the game
                game.playing = true;

                //start timeout for game abortion after 30s
                game.currentTimeout = setTimeout(function(){
                    //game abortion after 15s without moves
                    abortGame(game);
                }, 15000);
            }
        });
    });

    //player made a move
    socket.on("move", function(request){
        console.log("socket -> move");
        if(!("id" in request) || !_.isString(request.id)){
            //invalid request
            return;
        }

        if(!("move" in request)){
            //invalid request
            return;
        }

        //validate move
        if(!("from" in request.move) || !_.isString(request.move.from)){
            //invalid request (missing field 'from')
            return;
        }

        if(!("to" in request.move) || !_.isString(request.move.to)){
            //invalid request (missing field 'to')
            return;
        }
        
        if(("promotion" in request.move) && !_.isString(request.move.promotion)){
            //invalid request (invalid optional field 'promotion')
            return;
        }

        var game = data.activeGames[request.id];

        if(!game){
            //invalid game id
            return;
        }

        var user = utils.getServerUserBySocket(socket);

        if(!user){
            //invalid user
            return;
        }

        var color = game.getColorForUser(user._id);

        if(!color){
            //user not playing in this game
            return;
        }

        if(game.chess.turn() != color){
            //not this players turn
            return;
        }

        //make the mooooove
        var chessMove = game.chess.move(request.move);
        if(chessMove == null){
            //invalid move
            return;
        }
        
        //send move and resulting position to players and spectators (fixes castling and en passant)
        var move = {
            id: game.id,
            move: chessMove,
            fen: game.chess.fen()
        };

        game.white.socket.emit("move", move);
        game.black.socket.emit("move", move);
        utils.emitSpectators(game, "move", move);

        //check for game over
        if(game.chess.game_over()){
            clearTimeout(game.currentTimeout);
            gameOver(game);
            return;
        }

        //white made his first move -> start timeout waiting for blacks first move 
        //(TODO: variation support with black as the first to move (expose chess.js ply number))
        if(!game.timing && game.chess.turn() == "b"){
            clearTimeout(game.currentTimeout);
            
            game.currentTimeout = setTimeout(function(){
                //game abortion after 15s without moves
                abortGame(game);
            }, 15000);
        }else
        //both players made their first move -> start timer
        if(!game.timing && game.chess.turn() == "w"){
            //start the timer
            game.timing = true;

            //start the clocks
            var startGameResponse = {id: game.id};

            game.white.socket.emit("startGame", startGameResponse);
            game.black.socket.emit("startGame", startGameResponse);

            utils.emitSpectators(game, "startGame", startGameResponse);
        }

        if(game.timing){
            var timeout = game.chess.turn() == "w"? game.white.time : game.black.time;

            clearTimeout(game.currentTimeout);
            game.currentTimeout = setTimeout(function(){
                //set players time to 0
                if(game.chess.turn() == "w"){
                    game.white.time = 0;
                }
                else
                {
                    game.black.time = 0;
                }

                //player timed out
                gameOver(game);
            }, timeout * 60 * 1000);

            if(game.lastMoveTime != null){
                var timeSpent = (Date.now() - game.lastMoveTime) / (1000 * 60);

                if(game.chess.turn() == "w"){
                    //it was blacks turn
                    game.black.time -= timeSpent;
                    game.black.time += game.increment / 60;
                }else{
                    game.white.time -= timeSpent;
                    game.white.time += game.increment / 60;
                }

                if(game.black.time <= 0 || game.white.time <= 0){
                    console.log("time sub zero WTF");
                    gameOver(game);
                }
            }

            game.lastMoveTime = Date.now();

            console.log("time -> " + game.chess.turn() + " ( " + timeout + " )");

            //send time updates to players and spectators
            var times = {id: game.id, white: game.white.time, black: game.black.time};
            game.white.socket.emit("timeUpdate", times);
            game.black.socket.emit("timeUpdate", times);
            utils.emitSpectators(game, "timeUpdate", times);
        }
    });

    socket.on("resignGame", function(request){
        console.log("socket -> move");
        if(!("id" in request) || !_.isString(request.id)){
            //invalid request
            return;
        }

        var game = data.activeGames[request.id];

        if(!game){
            //invalid game id
            return;
        }

        if(!game.timing){
            //cannot resign before timer starts
            return;
        }

        var user = utils.getServerUserBySocket(socket);

        if(!user){
            //invalid user
            return;
        }

        var color = game.getColorForUser(user._id);

        if(!color){
            //user not playing in this game
            return;
        }

        if(color == "w"){
            game.white.resign = true;
        }else{
            game.black.resign = true;
        }

        //end the game
        gameOver(game);
    });

    socket.on("abortGame", function(request){
        console.log("socket -> move");
        if(!("id" in request) || !_.isString(request.id)){
            //invalid request
            return;
        }

        var game = data.activeGames[request.id];

        if(!game){
            //invalid game id
            return;
        }

        if(game.timing){
            //cannot abort after timer starts
            return;
        }

        var user = utils.getServerUserBySocket(socket);

        if(!user){
            //invalid user
            return;
        }

        var color = game.getColorForUser(user._id);

        if(!color){
            //user not playing in this game
            return;
        }

        abortGame(game);
    });
};
