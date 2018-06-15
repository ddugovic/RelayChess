var io = require("./socketConnection");
var co = require("co");
var _ = require("underscore");

//app modules
var data = require("../data");
var userToken = require("../userToken");

var utils = require("./utils");
var handleUsers = require("./handleUsers");
var handleSeeks = require("./handleSeeks");
var handleGames = require("./handleGames");

module.exports = {
    startServer: function()
    {
        //start the socket server
        io.on("connection", function(sock){
            handleUsers(sock);
            handleSeeks(sock);
            handleGames(sock);
       });
    }
};
