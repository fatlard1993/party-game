const { SocketServer } = require('byod-game-engine');
const TweakGame = require('./tweakGame');
const MindMazeGame = require('./mindMazeGame');
const Constants = require('./constants');

const PORT = process.env.PORT || 8080;

const server = require('./httpServer').init(PORT);
const socketServer = new SocketServer({ server });

var games = {
	mindMazeTest: new MindMazeGame(socketServer),
	mindMazeTestNumberTwo: new MindMazeGame(socketServer),
	tweakTest: new TweakGame(socketServer)
};

socketServer.createEndpoint(Constants.GAMES_LIST, function(){
	return Object.keys(games).reduce((map, name) => {
		map[name] = {
			game: games[name].name,
			id: games[name].id
		};

		return map;
	}, {});
});

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)