var express = require("express");
var mongodb = require("mongodb");

var co = require("co");
var _ = require("underscore");

//app modules
var config = require("./config");
var data = require("./data");
var userToken = require("./userToken");
var socketGameServer = require("./socketServer/socketServer");

var MongoClient = mongodb.MongoClient;

var app = express();

//enable cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res, next) {
  // Handle the get for this route
    console.log("GET");
});

app.post('/', function(req, res, next) {
 // Handle the post for this route
    console.log("POST");
});

//login
app.get("/twitch", function(req, res){
    console.log("twitch");
    co(function*(){
        var username = null;
        var token = req.query.token;
        var url = "https://api.twitch.tv/kraken?oauth_token=" + token;
        $.getJSON(url, function(data) {
            username = data.token.user_name;
        });

        //check if username exists
        var userQuery = yield data.userCollection.findOne({"name": username});
        if(userQuery == null)
        {
            var newUser = {
                ip: req.connection.remoteAddress,
                name: username,
                displayName: username,
                title: "",
                rating: {r: 1500, rd: 350.0, vol: 0.06}
            };
            var insertResult = yield data.userCollection.insertOne(newUser);
        }

        //generate login token
        var token = JSON.stringify(userToken.createUserToken(userQuery, req.query.token));
        res.json({result:true, token: token});
    });
});

//getUserInfo
app.get("/getUserInfo", function(req, res){
    console.log("getUserInfo request");
    res.send("getUserInfo");
});

//connect to db
MongoClient.connect(config.databaseURL, function (err, database) {
    if (err)
    {
        console.log("Unable to connect to the mongoDB server. Error:", err);
    } 
    else 
    {
        console.log("Connected to the mongoDB server.");
        data.database = database;
        data.gameCollection = database.collection("games");
        data.userCollection = database.collection("users");

        //start the server
        app.listen(config.apiServerPort, function(){
            console.log("api server running");

            socketGameServer.startServer();
            console.log("socket server running");
        });
    }
});

