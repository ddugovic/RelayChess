var io = require("./socketConnection");
var co = require("co");
var _ = require("underscore");

//app modules
var data = require("../data");
var userToken = require("../userToken");

function utils(){ }

utils.getServerUserBySocket = function(socket)
{
    for(var userId in data.loggedInUsers)
    {
        var user = data.loggedInUsers[userId];

        if(user.sockets.indexOf(socket) != -1)
        {
            return user;
        }
    }

    return null; };

utils.generateGameID = function()
{
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    };

    var id;

    //regenerate until we have a unique id
    while((id = generateUUID()) in data.activeGames){}

    return id;
};

utils.generateAnonID = function()
{
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    };

    var id;

    //regenerate until we have a unique id
    while("anonymous-" + (id = generateUUID()) in data.loggedInUsers){}

    return "anonymous-" + id;
};

utils.emitUserId = function(socket, user)
{
    socket.emit("userId", {username: user._id, displayName: user.name});
}

utils.emitUserUpdate = function(socket)
{
    //send online users and current seeks
    var publicUsers = [];

    //remove private fields
    for(var userId in data.loggedInUsers){
        var user = data.loggedInUsers[userId];

        publicUsers.push({
            id: userId,
            name: user.name,
            title: user.title,
            displayName: user.displayName,
            rating: user.rating
        });
    }

    socket.emit("userUpdate", {users: publicUsers});
};

utils.emitSeeksUpdate = function(socket)
{
    var publicSeeks = [];

    for(id in data.gameSeeks){
        var seek = data.gameSeeks[id];

        publicSeeks.push({
            id: id,
            name: seek.user.name,
            title: seek.user.title,
            displayName: seek.user.displayName,
            rating: seek.user.rating,
            time: seek.time,
            increment: seek.increment,
            rated: seek.rated
        });
    }

    socket.emit("seekUpdate", {seeks: publicSeeks});
};

utils.emitActiveGames = function(socket)
{
    co(function*(){
        var publicGames = [];

        for(game in data.activeGames){
            var game_ = data.activeGames[game];

            //get players from db
            var whitePlayer = game_.white; // ???
            var blackPlayer = game_.black; // ???

            publicGames.push({
                id : game_.id,
                white: {
                    _id: whitePlayer._id,
                    name: whitePlayer.name,
                    title: whitePlayer.title,
                    displayName: whitePlayer.displayName,
                    rating: whitePlayer.rating
                },
                black: {
                    _id: blackPlayer._id,
                    name: blackPlayer.name,
                    title: blackPlayer.title,
                    displayName: blackPlayer.displayName,
                    rating: blackPlayer.rating
                },
                time : game_.time,
                increment : game_.increment
            });
        }

        socket.emit("activeGameUpdate", {activeGames: publicGames});
    });
};

//emit message to all spectators of the game
utils.emitSpectators = function(game, message, object)
{
    for (user in game.spectators) {
        if (game.spectators[user]) {
            game.spectators[user].emit(message, object);
        }
    }
};

module.exports = utils;
