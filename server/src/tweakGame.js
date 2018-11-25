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

			if(property === 'usersDone' && value === this.state.activeUsers){
				Log.info()('Game over');

				var scores = [], scoreKey = {};
				var userIDs = this.state.activeUserIds;

				for(var x = 0, count = this.state.activeUsers; x < count; ++x){
					scores.push(UsersMap[userIDs[x]].state.gameTime);
					scoreKey[UsersMap[userIDs[x]].state.gameTime] = userIDs[x];
				}

				Log()(scores, scoreKey);

				this.state.scores = scores;
				this.state.scoreKey = scoreKey;

				this.state.action = 'RESET';
				this.state.stage = 'GAME OVER';
			}
		});

		socketServer.on(Constants.USER_JOIN_GAME, (socket, userId) => {
			let user;

			if(userId && UsersMap[userId]){
				user = UsersMap[userId];
				user.socket = socket;
				user.id = userId;
				// Join existing game if still active
			}

			else{
				user = new User(socketServer, socket);

				userId = user.id;
				this.state.activeUserIds.push(userId);
				++this.state.activeUsers;
			}

			socket.reply(Constants.USER_STATE_UPDATE, { id: userId });

			Log.info()(`User ${userId} joined`);

			socket.reply(Constants.GAME_STATE_UPDATE, this.state);
			socket.reply(Constants.USER_STATE_UPDATE, user.state);

			UsersMap[userId].state.latencyCheckStart = new Date().getTime();
			socket.reply(Constants.USER_LATENCY_CHECK);
		});

		socketServer.on(Constants.USER_LATENCY_CHECK, (socket, userId) => {
			UsersMap[userId].state.latency = new Date().getTime() - UsersMap[userId].state.latencyCheckStart;
		});

		socketServer.on(Constants.USER_GAME_ACTION, (socket, payload) => {
			if(payload.action === 'NOW'){
				UsersMap[payload.userId].state.gameTime = (new Date().getTime() - UsersMap[payload.userId].state.latency) - this.state.ready;

				++this.state.usersDone;
			}

			else if(payload.action === 'START'){
				this.start();
			}

			else if(payload.action === 'RESET'){
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