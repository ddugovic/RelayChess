module.exports = {
    databaseURL: "mongodb://localhost:27017/RelayChess",
    apiServerPort: 9090,
    socketServerPort: 3000,
    oauth: {
      client: {
        // change these to your Lichess oauth app,
        // that you can create on https://lichess.org/account/oauth/app
        id: 'q9xRRHB5uuZt3Fui',
        secret: 'JcC0B4TyTA6mQbI6TVixSDYYjF5wrz1A',
        // change this to your local host, or the prod host
        redirectUri: 'http://localhost:9090/login-with-lichess/callback',
      },
      server: {
        tokenHost: 'https://oauth.lichess.org',
        authorizePath: '/oauth/authorize',
        tokenPath: '/oauth'
      },
      scopes: [
        // probably won't ever need any scope
      ]
    }
};
