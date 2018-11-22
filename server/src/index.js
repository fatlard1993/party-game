const http = require('http');
const { SocketServer, Game, User, Log } = require('byod-game-engine');
const PORT = process.env.PORT || 8080;
const HttpServer = require('./httpServer');

const server = http.createServer(HttpServer.onRequest);
const socketServer = new SocketServer({ server });

server.listen(PORT, (err) => {
	if(err) return Log.error()(err);

	Log.info()(`Party Game server is listening on ${PORT}`);

	const game = new Game(socketServer);

	socketServer.on('userConnection', (clientConnection, userSettings) => {
		Log()('- User connected -', userSettings);

		var user = new User(socketServer, clientConnection);

		if(game.state[userSettings.id]){
			user.state.id = userSettings.id;
			game.state[userSettings.id] = user;

			clientConnection.send(JSON.stringify({ type: 'welcome', game: game.state }));
		}

		else clientConnection.send(JSON.stringify({ type: 'welcome', game: game.state, user: { id: user.state.id } }));

		game.state.users[user.state.id] = user;//doesnt emit change
		game.state[user.state.id] = 1;// if this is set to user it crashes

		clientConnection.on('message', (data) => {
			Log()('client message:', data);

			try{ data = JSON.parse(data); }
			catch(e){ data = { type: data }; }
		});

		clientConnection.on('disconnect', () => {
			Log.warn()(`User ${user.id} left`);

			delete game.state.users[user.state.id];
			delete game.state[user.state.id];
		});
	});
});

//serve room selection files to connecting clients
//manage rooms (game containers)
//serve game files for selected game(s)