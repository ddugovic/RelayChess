var io = require("./socketConnection");
var co = require("co");
var _ = require("underscore");

//app modules
var data = require("../data");
var userToken = require("../userToken");

var utils = require("./utils");

//TODO: anonymous users

module.exports = function(socket){
    //new login attempt
    socket.on("login", function(request){
        console.log("socket -> login");

        if(!("token" in request)){
            //invalid request
            return;
        }

        if(request.token == "anonymous"){
            //anonymous login request
            
            //check if this socket is associated with a different user already
            var ServerUser = utils.getServerUserBySocket(socket);

            if(ServerUser != null)
            {
                //ignore this
                return;
            }

            //create temporary anonymous user
            //for the moment we won't hand out signed anonymous tokens (so the only credentials anonymous users have is the socket connection, disconnect -> loss of identity)
            var anonID = utils.generateAnonID();

            var anonToken = {
                name: anonID,
                displayName: "Anonymous"
            };

            //new anonymous user -> insert object
            data.loggedInUsers[anonID] = {
                    name: anonID,
                    displayName: "Anonymous",
                    title: "",
                    rating: "?"
                };

            //add socket connection
            data.loggedInUsers[anonID].sockets = [];
            data.loggedInUsers[anonID].sockets.push(socket);

            console.log(anonID + " -> new connection");

            //send user update to all connected users
            utils.emitUserUpdate(io.sockets);

            //send temp token to anonymous user
            socket.emit("anonToken", anonToken);

            //send seek list to new connection
            utils.emitSeeksUpdate(socket);

            //send active game list to new connection
            utils.emitActiveGames(socket);
            return;
        }

        co(function*(){
            //check token
            if(userToken.validateUserToken(request.cookies['id']))
            {
                //valid token
                //find the user 
                var user = yield utils.getDatabaseUserByName(request.token.name);
                
                if(user == null){
                    socket.emit("logout");
                    socket.disconnect(true);

                    console.log("user not found");
                    return;
                }
                
                //check if this socket is associated with a different user already
                var ServerUser = utils.getServerUserBySocket(socket);

                if(ServerUser != null && ServerUser.name != user.name)
                {
                    //log out previous account
                    delete data.loggedInUsers[ServerUser.name];
                }

                //update / add user to online cache
                if(request.token.name in data.loggedInUsers)
                {
                    if(data.loggedInUsers[request.token.name].sockets.indexOf(socket) != -1){
                        //already have this socket stored
                        return;
                    }

                    console.log(user.name + " -> new connection");

                    //user already online -> update values
                    data.loggedInUsers[request.token.name].name = user.name;
                    data.loggedInUsers[request.token.name].title = user.title;
                    data.loggedInUsers[request.token.name].displayName = user.displayName;
                    data.loggedInUsers[request.token.name].rating = user.rating;

                    //add socket connection
                    data.loggedInUsers[request.token.name].sockets.push(socket);

                    //send user list to new connection
                    utils.emitUserUpdate(socket);
                }
                else
                {
                    console.log(user.name + " -> connected");
                    //new user -> insert object
                    data.loggedInUsers[request.token.name] = user;

                    //add socket connection
                    data.loggedInUsers[request.token.name].sockets = [];
                    data.loggedInUsers[request.token.name].sockets.push(socket);

                    //send user update to all connected users
                    utils.emitUserUpdate(io.sockets);
                }

                //send seek list to new connection
                utils.emitSeeksUpdate(socket);

                //send active game list to new connection
                utils.emitActiveGames(socket);
            }
            else
            {
                //invalid token
                socket.emit("logout");
                socket.disconnect(true);

                console.log("invalid token");
            }
        });
    });

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
                console.log(user.name + " -> disconnected");

                //removed last connection to user
                //remove all seeks from user
                if(user.name in data.gameSeeks){
                    delete data.gameSeeks[user.name];

                    //push updated seeks to all players
                    utils.emitSeeksUpdate(io.sockets);
                }

                //remove from online array
                delete data.loggedInUsers[user.name];

                //send user update to all connected users
                utils.emitUserUpdate(io.sockets);
            }
        }
    });
};
