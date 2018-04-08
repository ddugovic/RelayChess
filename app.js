var express = require('express');
var mongodb = require('mongodb');

var co = require('co');
var _ = require('underscore');

//app modules
var config = require('./config');
var oauthClient = require('./oauth.client');
var data = require('./data');
var socketGameServer = require('./socketServer/socketServer');

const simpleOauth = require('simple-oauth2');
const axios = require('axios');
const crypto = require('crypto');

var MongoClient = mongodb.MongoClient;

var app = express();

const oauth2 = simpleOauth.create({
  client: {
    id: oauthClient.id,
    secret: oauthClient.secret,
  },
  auth: {
    tokenHost: config.oauth.tokenHost,
    authorizePath: config.oauth.authorizePath,
    tokenPath: config.oauth.tokenPath
  }
});

const state = Math.random().toString(36).substring(2);
const authorizationUri = `${config.oauth.tokenHost}${config.oauth.authorizePath}?response_type=code&client_id=${oauthClient.id}&redirect_uri=${oauthClient.redirectUri}&scope=${config.oauth.scopes.join('%20')}&state=${state}`;

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
    // generate secure-random token prior to side effects
    const sessionId = crypto.randomBytes(48).toString('base64');
    const result = await oauth2.authorizationCode.getToken({
      code: req.query.code,
      redirect_uri: oauthClient.redirectUri
    });
    // console.log(result);
    const token = oauth2.accessToken.create(result);
    const lichessUser = await axios.get('/account/me', {
      baseURL: 'https://lichess.org/',
      headers: { 'Authorization': 'Bearer ' + token.token.access_token }
    }).then(r => r.data);

    // create new session
    const newSession = {
        _id: sessionId,
        user: lichessUser._id,
        createdAt: new Date(),
        active: true
    };
    await data.sessionCollection.insertOne(newSession);

    //check if username exists
    const dbUser = await data.userCollection.findOne({_id: lichessUser.id});
    if (dbUser) {
        //res.send(`<h1>Success!</h1>The user already exists in DB: <pre>${JSON.stringify(dbUser)}</pre>`);
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
        //res.send(`<h1>Success!</h1>The user has been created in DB: <pre>${JSON.stringify(newUser)}</pre>`);
    }
    res.cookie('id', sessionId, { httpOnly: true });
    res.redirect(config.baseURL);
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
        data.gameCollection = database.collection("game");
        data.userCollection = database.collection("user");
        data.sessionCollection = database.collection("session");

        //start the server
        app.listen(config.apiServerPort, function(){
            console.log("api server running");

            socketGameServer.startServer();
            console.log("socket server running");
        });
    }
});

