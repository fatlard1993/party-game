const { SocketServer, Log } = require('byod-game-engine');
const TweakGame = require('./tweakGame');

const PORT = process.env.PORT || 8080;

const server = require('./httpServer').init(PORT);
const socketServer = new SocketServer({ server });

const testGame = new TweakGame(socketServer);

Log.info()(`Started ${testGame.name}: ${testGame.id}`);

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)