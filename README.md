# RelayChess
Unleash the madness! Pieces (not pawns) inherit movement powers when protected.

# How to run

```
cp oauth.client.js.default oauth.client.js
```
Edit oauth.client.js with your oauth config.
```
npm i
node app.js
```
In another terminal:
```
cd html
http-server # or `python -m SimpleHTTPServer` or any HTTP file server
```
Now open http://localhost:8080/index.html, you should see the homepage.

# Database
MongoDB 2.6.10

# Server
NodeJS 8.11.1
Ports used: 9090 for login (express) webserver, 3000 for socket (socket.io) server

# Service (Ubuntu 16.04)
To register RelayChess using systemd, copy `relaychess.service` into the system folder then `systemctl daemon-reload`.
