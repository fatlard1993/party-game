const { SocketServer, Log } = require('byod-game-engine');
const TweakGame = require('./tweakGame');
const MindMazeGame = require('./mindMazeGame');

const PORT = process.env.PORT || 8080;

const server = require('./httpServer').init(PORT);
const socketServer = new SocketServer({ server });

var games = {
	mindMazeTest: new MindMazeGame(socketServer),
	// mindMazeTestNumberTwo: new MindMazeGame(socketServer),
	// tweakTest: new TweakGame(socketServer)
};

socketServer.on('clientMessage', (socket, data) => {
	Log()('(index) Client socket message: ', data.type, data.payload);

	if(data.type === 'gamesList'){
		var gamesList = {}, gameNames = Object.keys(games), gameCount = gameNames.length;

		for(var x = 0; x < gameCount; ++x){
			gamesList[gameNames[x]] = { game: games[gameNames[x]].name, id: games[gameNames[x]].id };
		}

		socket.reply('gamesList', gamesList);
	}
});

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)