//global data cache

module.exports = {
    //mongodb database
    database: null,
    userCollection: null,
    sessionCollection: null,
    gameCollection: null,

    //server data
    loggedInUsers: {},
    gameSeeks: {},
    activeGames: {}
};
