const { Game, Log, Cjs, Constants, UsersMap } = require('byod-game-engine');
const localConstants = require('./constants');
const MindMazeUser = require('./mindMazeUser');

Object.assign(Constants, localConstants);

module.exports = class MindMazeGame extends Game {
	constructor(socketServer){
		super(socketServer);

		this.name = 'MindMaze';

		this.reset = () => {
			this.state.winner = '';
			this.state.activeUserIds = [];
			this.state.usersReady = 0;
			this.state.gridSize = 0;
			this.state.stage = 'WAITING';
		};

		this.start = () => {
			this.state.stage = 'SET PATH';

			this.state.gridSize = this.state.activeUserIds.length <= 8 ? 5 : (this.state.activeUserIds.length <= 12 ? 7 : 9);

			var startingPositions = {
				'5': [
					{ x: 1, y: 0 },
					{ x: 3, y: 0 },
					{ x: 0, y: 1 },
					{ x: 0, y: 3 },
					{ x: 3, y: 1 },
					{ x: 3, y: 3 },
					{ x: 1, y: 3 },
					{ x: 3, y: 3 }
				]
			};

			startingPositions[this.state.gridSize] = Cjs.shuffleArr(startingPositions[this.state.gridSize]);

			var userIds = this.state.activeUserIds;

			for(var x = 0, count = userIds.length; x < count; ++x){
				UsersMap[userIds[x]].state.startingPosition = startingPositions[this.state.gridSize][x];
			}
		};

		this.state.on('change', (event, property, value) => {
			Log()('(tweakGame) Game state change - ', property, value);

			if(property === 'usersReady' && value && value >= this.state.activeUserIds.length){
				this.state.stage = 'RACE';

				Log.info()('Begin Race!');

				//todo move each player turn by turn until they reach the center or collide with another player
				//users get points for moving a space, and more points for getting to the middle, bonus points for getting there fast (time bonus, or place bonus)
			}
		});

		socketServer.on(Constants.USER_JOIN_GAME, (socket, userId) => {
			let user;

			if(userId && UsersMap[userId]){
				user = UsersMap[userId];
				user.socket = socket;
				user.socket.id = userId;

				// Join existing game if still active
				if(this.id === user.gameId) Log.info()('Users game is still active');
			}

			else user = new MindMazeUser(socketServer, socket, this);

			socket.reply(Constants.USER_STATE_UPDATE, { id: user.id });
			socket.reply(Constants.USER_STATE_UPDATE, user.state);

			this.state.activeUserIds.push(user.id);

			Log.info()(`User ${user.id} joined`);

			socket.reply(Constants.GAME_STATE_UPDATE, this.state);
		});

		socketServer.on(Constants.USER_DISCONNECT, (socket) => {
			this.state.activeUserIds.splice(this.state.activeUserIds.indexOf(socket.id), 1);
		});

		socketServer.on(Constants.USER_GAME_ACTION, (socket, action) => {
			if(action === 'READY'){
				Log.info()(`Player #${socket.id} is ready`);
			}
		});

		this.reset();
	}
};