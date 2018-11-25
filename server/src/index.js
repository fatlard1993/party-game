const { SocketServer, Game, User, Log, Cjs } = require('byod-game-engine');

const PORT = process.env.PORT || 8080;

const server = require('./httpServer').init(PORT);
const socketServer = new SocketServer({ server });

const game = new Game(socketServer);

game.reset = function(){
	game.state.activeUsers = 0;
	game.state.usersDone = 0;
	game.state.users = {};
};

game.start = function(){
	setTimeout(function(){
		game.state.ready = new Date().getTime();
	}, Cjs.randInt(5, 10) * 1000);
};

game.reset();

socketServer.on('userConnection', (clientConnection, userSettings) => {
	Log()('- User connected -', userSettings);

	var user = new User(socketServer, clientConnection);

	if(game.state[userSettings.id]){
		user.state.id = userSettings.id;
		game.state[userSettings.id] = user;

		clientConnection.send(JSON.stringify({ type: 'welcome', game: game.state }));
	}

	else clientConnection.send(JSON.stringify({ type: 'welcome', game: game.state, user: { id: user.state.id } }));

	var latencyCheckStart = new Date().getTime();

	// game.state.users[user.state.id] = user;//doesnt emit change - this shit was the cause of the crash
	++game.state.activeUsers;
	game.state.users[user.state.id] = {};

	game.state.on('change', (event, property, value) => {
		Log()('(Index) Game state change - ', event, property, value, game.state);

		if(property === 'usersDone' && value === game.state.activeUsers){
			Log.info()('Game over');

			//game.reset();
			var scores = [], scoreKey = {};
			var userIDs = Object.keys(game.state.users);

			for(var x = 0, count = game.state.activeUsers; x < count; ++x){
				scores.push(game.state.users[userIDs[x]].gameTime);
				scoreKey[game.state.users[userIDs[x]].gameTime] = userIDs[x];
			}

			Log()(scores, scoreKey);

			socketServer.broadcast({ type: 'gameOver', winner: scoreKey[Cjs.sortArrAlphaNumeric(scores)[0]] });
		}
	});

	clientConnection.on('message', (data) => {
		Log()('client message:', data);

		try{ data = JSON.parse(data); }
		catch(e){ data = { type: data }; }

		if(data.type === 'latencyCheck'){
			user.state.latency = new Date().getTime() - latencyCheckStart;
		}

		else if(data.type === 'GO'){
			user.state.gameTime = (new Date().getTime() - user.state.latency) - game.state.ready;
			game.state.users[user.state.id].gameTime = user.state.gameTime;

			++game.state.usersDone;
		}

		else if(data.type === 'START'){
			game.start();
		}

		else if(data.type === 'RESTART'){
			game.reset();
			game.start();
		}
	});

	clientConnection.on('disconnect', () => {
		Log.warn()(`User ${user.id} left`);

		delete game.state.users[user.state.id];
		delete game.state[user.state.id];
	});
});

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)