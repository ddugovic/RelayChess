module.exports = {
    baseURL: "http://localhost/",
    databaseURL: "mongodb://localhost:27017/RelayChess",
    apiServerPort: 9090,
    socketServerPort: 3000,
    oauth: {
      tokenHost: 'https://oauth.lichess.org',
      authorizePath: '/oauth/authorize',
      tokenPath: '/oauth',
      scopes: [
        // probably won't ever need any scope
      ]
    }
};
