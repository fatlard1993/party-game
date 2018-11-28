const { SocketServer, Log } = require('byod-game-engine');
const TweakGame = require('./tweakGame');
const MindMazeGame = require('./mindMazeGame');

const PORT = process.env.PORT || 8080;

const server = require('./httpServer').init(PORT);
const socketServer = new SocketServer({ server });

const mindMaze = new MindMazeGame(socketServer);
// const tweak = new TweakGame(socketServer);

Log.info()(`Started ${mindMaze.name}: ${mindMaze.id}`);
// Log.info()(`Started ${tweak.name}: ${tweak.id}`);

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)