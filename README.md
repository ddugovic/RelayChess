# RelayChess
Unleash the madness! Pieces (not pawns) inherit movement powers when protected.

![RelayChess Lobby](https://raw.githubusercontent.com/ddugovic/relaychess/imgs/lobby.png)

# How to run

Edit oauth.client.js with your oauth config.
```
cp ./server/src/oauth.client.js.default ./server/src/oauth.client.js
```
Then run:
```
cd server && npm install
node src/app.js
```
In another terminal run:
```
cd web/src/html && http-server # or `python -m SimpleHTTPServer` or any HTTP file server
```
Now open http://localhost:8080/index.html. You should see the homepage.

# Database
MongoDB 2.6.10

# Server
NodeJS 8.11.1
Ports used: 9090 for login (express) webserver, 3000 for socket (socket.io) server

# Service (Ubuntu 16.04)
To register RelayChess using systemd, copy `relaychess.service` into the system folder then `systemctl daemon-reload`.
