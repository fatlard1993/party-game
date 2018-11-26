const { Game, User, Log, Cjs, Constants, UsersMap } = require('byod-game-engine');
const localConstants = require('./constants');

Object.assign(Constants, localConstants);

module.exports = class TweakGame extends Game {
	constructor(socketServer){
		super(socketServer);

		this.name = 'TweakGame';

		this.reset = () => {
			this.state.activeUserIds = [];
			this.state.activeUsers = 0;
			this.state.usersDone = 0;
			this.state.action = 'START';
			this.state.stage = 'WAITING';
		};

		this.start = () => {
			this.state.stage = 'STARTED';
			this.state.action = 'NONE';

			setTimeout(() => {
				this.state.action = 'NOW';
				this.state.stage = 'END';
				this.state.ready = new Date().getTime();
			}, Cjs.randInt(2000, 6000));
		};

		this.state.on('change', (event, property, value) => {
			Log()('(tweakGame) Game state change - ', property, value);

			if(property === 'usersDone' && value >= this.state.activeUsers){
				Log.info()('Game over');

				var scores = [], scoreKey = {};
				var userIds = this.state.activeUserIds;

				for(var x = 0, count = this.state.activeUsers; x < count; ++x){
					scores.push(UsersMap[userIds[x]].state.gameTime);
					scoreKey[UsersMap[userIds[x]].state.gameTime] = userIds[x];
				}

				Log()(scores, scoreKey);

				this.state.scores = scores;
				this.state.scoreKey = scoreKey;

				this.state.action = 'RESET';
				this.state.stage = 'GAME OVER';
			}
		});

		socketServer.on(Constants.USER_JOIN_GAME, (socket, userId) => {
			Log.error()(userId);

			this.state.activeUserIds.push(userId);
			++this.state.activeUsers;

			socket.reply(Constants.GAME_STATE_UPDATE, this.state);

			UsersMap[userId].state.latencyCheckStart = new Date().getTime();
			socket.reply(Constants.USER_LATENCY_CHECK);
		});

		socketServer.on(Constants.USER_DISCONNECT, (socket) => {
			this.state.activeUserIds.splice(this.state.activeUserIds.indexOf(socket.id), 1);

			--this.state.activeUsers;
		});

		socketServer.on(Constants.USER_LATENCY_CHECK, (socket) => {
			UsersMap[socket.id].state.latency = new Date().getTime() - UsersMap[socket.id].state.latencyCheckStart;
		});

		socketServer.on(Constants.USER_GAME_ACTION, (socket, action) => {
			if(action === 'NOW'){
				UsersMap[socket.id].state.gameTime = (new Date().getTime() - UsersMap[socket.id].state.latency) - this.state.ready;

				++this.state.usersDone;
			}

			else if(action === 'START'){
				this.start();
			}

			else if(action === 'RESET'){
				this.reset();
			}
		});

		this.reset();
	}
};

// clientConnection.on('disconnect', () => {
// 	Log.warn()(`User ${user.id} left`);

// 	delete game.users[user.state.id];
// 	delete game.state[user.state.id];
// });