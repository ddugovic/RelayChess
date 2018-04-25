var io = require('./socketConnection');
var co = require('co');
var cookie = require('cookie');
var _ = require('underscore');

//app modules
var data = require("../data");

var utils = require("./utils");

function handleAnonymous(socket) {
    //check if this socket is associated with a different user already
    var serverUser = utils.getServerUserBySocket(socket);
    if(serverUser) return;

    //create temporary anonymous user
    var anonID = utils.generateAnonID();

    //new anonymous user -> insert object
    data.loggedInUsers[anonID] = {
            _id: anonID,
            name: anonID,
            displayName: "Anonymous",
            title: "",
            rating: "?"
        };

    //add socket connection
    data.loggedInUsers[anonID].sockets = [socket];

    console.log(anonID + " -> new connection");

    //send user update to all connected users
    utils.emitUserUpdate(io.sockets);

    //send seek list to new connection
    utils.emitSeeksUpdate(socket);

    //send active game list to new connection
    utils.emitActiveGames(socket);
}

function handleUser(socket, user) {
    const userId = user._id;

    //check if this socket is associated with a different user already
    var ServerUser = utils.getServerUserBySocket(socket);

    if(ServerUser != null && ServerUser._id != userId)
    {
        //log out previous account
        delete data.loggedInUsers[ServerUser._id];
    }

    //update / add user to online cache
    if(userId in data.loggedInUsers)
    {
        if(data.loggedInUsers[userId].sockets.indexOf(socket) != -1){
            //already have this socket stored
            return;
        }

        console.log(userId + " -> new connection");

        //user already online -> update values
        data.loggedInUsers[userId]._id = userId;
        data.loggedInUsers[userId].name = user.name;
        data.loggedInUsers[userId].title = user.title;
        data.loggedInUsers[userId].displayName = user.displayName;
        data.loggedInUsers[userId].rating = user.rating;

        //add socket connection
        data.loggedInUsers[userId].sockets.push(socket);

        //send user list to new connection
        utils.emitUserUpdate(socket);
    }
    else
    {
        console.log(userId + " -> connected");
        //new user -> insert object
        data.loggedInUsers[userId] = user;

        //add socket connection
        data.loggedInUsers[userId].sockets = [socket];

        //send user update to all connected users
        utils.emitUserUpdate(io.sockets);
    }

    //send seek list to new connection
    utils.emitSeeksUpdate(socket);

    //send active game list to new connection
    utils.emitActiveGames(socket);
}

async function handleConnect(socket) {
    const sessionId = cookie.parse(socket.handshake.headers.cookie || '').relayChessSessionId;
    if (!sessionId) handleAnonymous(socket);
    else {
      const session = await data.sessionCollection.findOne({_id: sessionId, active: true});
      if (!session) handleAnonymous(socket);
      else {
        const user = await data.userCollection.findOne({_id: session.user});
        if (!user) handleAnonymous(socket);
        else handleUser(socket, user);
      }
    }
}

module.exports = function(socket) {
    
    handleConnect(socket);

    //socket disconnected
    socket.on("disconnect", function(){
        console.log("socket -> disconnected");

        //remove user's socket
        var user = utils.getServerUserBySocket(socket);

        if(user == null)
            return;
        
        var socketIndex = user.sockets.indexOf(socket);
        if(socketIndex != -1){
            //remove socket
            user.sockets.splice(socketIndex,1);

            if(user.sockets.length == 0){
                console.log(user._id + " -> disconnected");

                //removed last connection to user
                //remove all seeks from user
                if(user._id in data.gameSeeks){
                    delete data.gameSeeks[user._id];

                    //push updated seeks to all players
                    utils.emitSeeksUpdate(io.sockets);
                }

                //remove from online array
                delete data.loggedInUsers[user._id];

                //send user update to all connected users
                utils.emitUserUpdate(io.sockets);
            }
        }
    });
};
