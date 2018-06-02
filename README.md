# RelayChess
Unleash the madness! Pieces (not pawns) inherit movement powers when protected.

# How to run
First, copy the oauth config into the appropriate place:
```
cd server/src/
cp oauth.client.js.default oauth.client.js
```
Then, edit oauth.client.js with your lichess oauth config. You can find out
how to generate the necessary oauth tokens [here](https://lichess.org/account/oauth/app).

Now, run:
```
npm run dev
```
This will install the necessary dependencies, launch the server, and open a browser with the
page loaded (using [lite-server](https://github.com/johnpapa/lite-server)). When you make changes to
frontend and save the file they should be automatically reflected in the browser.

# Database
MongoDB 2.6.10

# Server
NodeJS 8.11.1
Ports used: 9090 for login (express) webserver, 3000 for socket (socket.io) server

# Service (Ubuntu 16.04)
To register RelayChess using systemd, copy `relaychess.service` into the system folder then `systemctl daemon-reload`.
