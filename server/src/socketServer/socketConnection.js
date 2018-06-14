var config = require("../config");
module.exports = require('socket.io').listen(config.socketServerPort);