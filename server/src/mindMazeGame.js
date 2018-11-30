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
			this.state.gridSize = 0;
			this.state.stage = 'WAITING ROOM';
			this.state.action = 'START';
		};

		this.start = () => {
			this.state.stage = 'SET PATH';
			this.state.action = 'DONE';

			var userCount = this.state.activeUserIds.length;

			this.state.gridSize = userCount <= 8 ? 5 : (userCount <= 12 ? 7 : 9);

			var startingPositions = {
				'5': [
					{ x: 1, y: 0 },
					{ x: 3, y: 0 },
					{ x: 1, y: 4 },
					{ x: 3, y: 4 },
					{ x: 0, y: 1 },
					{ x: 0, y: 3 },
					{ x: 4, y: 1 },
					{ x: 4, y: 3 }
				],
				'7': [
					{ x: 1, y: 0 },
					{ x: 3, y: 0 },
					{ x: 5, y: 0 },
					{ x: 1, y: 4 },
					{ x: 3, y: 4 },
					{ x: 5, y: 4 },
					{ x: 0, y: 1 },
					{ x: 0, y: 3 },
					{ x: 0, y: 5 },
					{ x: 4, y: 1 },
					{ x: 4, y: 3 },
					{ x: 4, y: 5 }
				],
				'9': [
					{ x: 1, y: 0 },
					{ x: 3, y: 0 },
					{ x: 5, y: 0 },
					{ x: 7, y: 0 },
					{ x: 1, y: 4 },
					{ x: 3, y: 4 },
					{ x: 5, y: 4 },
					{ x: 7, y: 4 },
					{ x: 0, y: 1 },
					{ x: 0, y: 3 },
					{ x: 0, y: 5 },
					{ x: 0, y: 7 },
					{ x: 4, y: 1 },
					{ x: 4, y: 3 },
					{ x: 4, y: 5 },
					{ x: 4, y: 7 }
				]
			};

			startingPositions[this.state.gridSize] = Cjs.shuffleArr(startingPositions[this.state.gridSize]);

			var userIds = this.state.activeUserIds;

			for(var x = 0, count = userIds.length; x < count; ++x){
				UsersMap[userIds[x]].state.startingPosition = startingPositions[this.state.gridSize][x];
			}
		};

		// this.state.on('change', (event, property, value) => {
		// 	Log()('(tweakGame) Game state change - ', property, value);

		// 	if(property === 'usersReady' && value && value >= this.state.activeUserIds.length){
		// 		this.state.stage = 'RACE';
		// 		this.state.action = 'WAIT';

		// 		Log.info()('Begin Race!');

		// 		//todo move each player turn by turn until they reach the center or collide with another player
		// 		//users get points for moving a space, and more points for getting to the middle, bonus points for getting there fast (time bonus, or place bonus)
		// 	}
		// });

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

			if(this.state.stage.startsWith('WAITING ROOM')) this.state.stage = `WAITING ROOM - ${this.state.activeUserIds.length} PLAYER${this.state.activeUserIds.length > 1 ? 'S' : ''}`;

			Log.info()(`User ${user.id} joined`);

			socket.reply(Constants.GAME_STATE_UPDATE, this.state);
		});

		socketServer.on(Constants.USER_DISCONNECT, (socket) => {
			this.state.activeUserIds.splice(this.state.activeUserIds.indexOf(socket.id), 1);
		});

		socketServer.on(Constants.USER_GAME_ACTION, (socket, action) => {
			var userIds = this.state.activeUserIds, x, totalUsers = userIds.length;

			if(action === 'START'){
				UsersMap[socket.id].state.ready = true;

				Log.info()(`Player #${socket.id} is ready to start`);

				var allUsersReady = true;

				for(x = 0; x < totalUsers; ++x){
					if(!UsersMap[userIds[x]].state.ready) allUsersReady = false;
				}

				if(allUsersReady) this.start();
			}

			else if(action === 'DONE'){
				UsersMap[socket.id].state.done = true;

				Log.info()(`Player #${socket.id} is done setting their path`);

				var allUsersDone = true;

				for(x = 0; x < totalUsers; ++x){
					if(!UsersMap[userIds[x]].state.done) allUsersDone = false;
				}

				if(allUsersDone){
					this.state.stage = 'RACE';
					this.state.action = 'WAIT';

					Log.info()('Begin Race!');

					//todo move each player turn by turn until they reach the center or collide with another player
					//users get points for moving a space, and more points for getting to the middle, bonus points for getting there fast (time bonus, or place bonus)
				}
			}
		});

		this.reset();
	}
};