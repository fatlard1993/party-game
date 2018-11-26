const { Game, Log, Cjs, Constants, UsersMap } = require('byod-game-engine');
const localConstants = require('./constants');
const TweakUser = require('./tweakUser');

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
			this.state.action = 'WAIT';

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
					scores.push(UsersMap[userIds[x]].state.score);
					scoreKey[UsersMap[userIds[x]].state.score] = userIds[x];
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
				user.id = socket.id = userId;
				// Join existing game if still active

				if(this.id === user.gameId) Log.info()('Users game is still active');
			}

			else user = new TweakUser(socketServer, socket, this);

			socket.reply(Constants.USER_STATE_UPDATE, { id: user.id });

			Log.info()(`User ${user.id} joined`);

			socket.reply(Constants.USER_STATE_UPDATE, user.state);

			this.state.activeUserIds.push(user.id);
			++this.state.activeUsers;

			socket.reply(Constants.GAME_STATE_UPDATE, this.state);
		});

		socketServer.on(Constants.USER_DISCONNECT, (socket) => {
			this.state.activeUserIds.splice(this.state.activeUserIds.indexOf(socket.id), 1);

			--this.state.activeUsers;
		});

		socketServer.on(Constants.USER_GAME_ACTION, (socket, action) => {
			if(action === 'NOW' && !UsersMap[socket.id].state.score){
				UsersMap[socket.id].state.score = ((new Date().getTime() - UsersMap[socket.id].state.latency) - this.state.ready) + UsersMap[socket.id].state.penalty;

				Log.info()('Score: ', UsersMap[socket.id].state.score);

				++this.state.usersDone;
			}

			else if(action === 'WAIT'){
				UsersMap[socket.id].state.penalty += 100;

				Log.error()('penalty: ', UsersMap[socket.id].state.penalty);
			}

			else if(action === 'START'){
				this.start();
			}

			else if(action === 'RESET'){
				this.reset();

				UsersMap[socket.id].reset();
			}
		});

		this.reset();
	}
};