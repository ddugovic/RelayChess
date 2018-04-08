# RelayChess
The future of chess is now!

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
MongoDB 3.2.9

# Server
NodeJS 6.5.0

# Dependencies
co, express, glicko2-lite, mongodb, socket.io, underscore

To deploy restore the RelayChess database using `mongorestore`, install node & required dependencies, and launch `app.js`.

Ports used: 9090 for login/register express webserver, 3000 for socket server

# Service (Ubuntu 16.04)
To register RelayChess as a service, copy `relaychess.service` into the system folder then `systemctl daemon-reload`.
