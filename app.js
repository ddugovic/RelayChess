var express = require("express");
var mongodb = require("mongodb");

var co = require("co");
var _ = require("underscore");

//app modules
var config = require("./config");
var data = require("./data");
var userToken = require("./userToken");
var socketGameServer = require("./socketServer/socketServer");

const simpleOauth = require('simple-oauth2');
const axios = require('axios');

var MongoClient = mongodb.MongoClient;

var app = express();

const oauth2 = simpleOauth.create({
  client: {
    id: config.oauth.client.id,
    secret: config.oauth.client.secret,
  },
  auth: {
    tokenHost: config.oauth.server.tokenHost,
    authorizePath: config.oauth.server.authorizePath,
    tokenPath: config.oauth.server.tokenPath
  }
});

const state = Math.random().toString(36).substring(2);
const authorizationUri = `${config.oauth.server.tokenHost}${config.oauth.server.authorizePath}?response_type=code&client_id=${config.oauth.client.id}&redirect_uri=${config.oauth.client.redirectUri}&scope=${config.oauth.scopes.join('%20')}&state=${state}`;

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

app.get('/login-with-lichess', (req, res) => {
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

// Redirect URI: parse the authorization token and ask for the access token
app.get('/login-with-lichess/callback', async (req, res) => {
  try {
    const result = await oauth2.authorizationCode.getToken({
      code: req.query.code,
      redirect_uri: config.oauth.client.redirectUri
    });
    // console.log(result);
    const token = oauth2.accessToken.create(result);
    const lichessUser = await axios.get('/account/me', {
      baseURL: 'https://lichess.org/',
      headers: { 'Authorization': 'Bearer ' + token.token.access_token }
    }).then(r => r.data);

    //check if username exists
    const dbUser = await data.userCollection.findOne({"name": lichessUser.id});
    if(dbUser) {
      res.send(`<h1>Success!</h1>The user already exists in DB: <pre>${JSON.stringify(dbUser)}</pre>`);
    } else {
        const newUser = {
            _id: lichessUser.id,
            ip: req.connection.remoteAddress,
            name: lichessUser.username,
            displayName: lichessUser.username,
            title: "",
            rating: {r: 1500, rd: 350.0, vol: 0.06}
        };
        await data.userCollection.insertOne(newUser);
        res.send(`<h1>Success!</h1>The user has been created in DB: <pre>${JSON.stringify(newUser)}</pre>`);
    }
  } catch(error) {
    console.error('Access Token Error', error.message);
    res.status(500).json('Authentication failed');
  }
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

