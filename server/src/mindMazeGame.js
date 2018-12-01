const { Game, Log, Cjs, UsersMap } = require('byod-game-engine');
const Constants = require('./constants');
const MindMazeUser = require('./mindMazeUser');

class MindMazeGame extends Game {
	constructor(socketServer){
		super(socketServer);

		this.name = 'mindMaze';
		this.user = MindMazeUser;

		this.reset();

		this.state.on('change', (event, property, value) => {
			Log()('(mindMaze) Game state change - ', property, value);

			if(property === 'mapUpdate'){
				this.broadcast('gameState', { map: this.state.map });
			}
		});

		this.on(Constants.USER_JOIN_GAME, () => {
			if(this.state.stage.startsWith('WAITING ROOM')) this.state.stage = `WAITING ROOM - ${this.state.userCount} PLAYER${this.state.userCount > 1 ? 'S' : ''}`;
		});

		this.on(Constants.USER_SET_STEP, (position, socket) => {
			UsersMap[socket.id].state.steps.push(position);

			this.state.maxSteps = Math.max(this.state.maxSteps, UsersMap[socket.id].state.steps.length);
		});

		this.on(Constants.USER_GAME_ACTION, (action, socket) => {
			var x;

			if(action === Constants.USER_ACTION_START){
				UsersMap[socket.id].state.ready = true;

				Log.info()(`Player #${socket.id} is ready to start`);

				var allUsersReady = true;

				for(x = 0; x < this.state.userCount; ++x){
					if(!UsersMap[this.userIds[x]].state.ready) allUsersReady = false;
				}

				if(allUsersReady) this.start();
			}

			else if(action === Constants.USER_ACTION_DONE){
				UsersMap[socket.id].state.done = true;

				Log.info()(`Player #${socket.id} is done setting their path`);

				var allUsersDone = true;

				for(x = 0; x < this.state.userCount; ++x){
					if(!UsersMap[this.userIds[x]].state.done) allUsersDone = false;
				}

				if(allUsersDone) this.race();
			}
		});
	}
}

MindMazeGame.prototype.reset = function(){
	this.users = {};
	this.userIds = [];

	this.state.winner = '';
	this.state.userCount = 0;
	this.state.map = [];
	this.state.mapUpdate = 0;
	this.state.gridSize = 0;
	this.state.maxSteps = 0;
	this.state.stage = Constants.GAME_STAGE_WAITING_ROOM;
	this.state.action = Constants.GAME_ACTION_START;

	for(var x = 0; x < this.state.userCount; ++x){
		UsersMap[this.userIds[x]].state.steps = [];
		UsersMap[this.userIds[x]].state.startingPosition = null;
		UsersMap[this.userIds[x]].state.stopped = false;
	}
};

MindMazeGame.prototype.start = function(){
	this.state.stage = Constants.GAME_STAGE_SET_PATH;
	this.state.action = Constants.GAME_ACTION_DONE;

	var userIds = this.userIds;
	var userCount = this.state.userCount;

	this.state.gridSize = userCount <= 4 ? 3 : (userCount <= 8 ? 5 : (userCount <= 12 ? 7 : 9));

	var startingPositions = {
		'3': [
			{ x: 1, y: 0 },
			{ x: 1, y: 2 },
			{ x: 0, y: 1 },
			{ x: 2, y: 1 }
		],
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

	for(var x = 0; x < userCount; ++x){
		UsersMap[userIds[x]].state.startingPosition = startingPositions[this.state.gridSize][x];

		UsersMap[userIds[x]].state.steps.push(UsersMap[userIds[x]].state.startingPosition);
	}

	this.generateMap(this.state.gridSize);
};

MindMazeGame.prototype.race = function(step){
	if(typeof step === 'undefined'){
		this.state.stage = Constants.GAME_STAGE_RACE;
		this.state.action = Constants.GAME_ACTION_WAIT;

		++this.state.mapUpdate;

		Log.info()('Begin Race!');

		//todo move each player turn by turn until they reach the center or collide with another player
		//users get points for moving a space, and more points for getting to the middle, bonus points for getting there fast (time bonus, or place bonus)

		step = 0;
	}

	var keepGoing = this.stepUsers(step);

	if(keepGoing) setTimeout(this.race.bind(this, ++step), Math.min(800, (Constants.GAME_RACE_MAX_SECONDS * 1000) / this.state.maxSteps));

	else this.reset();
};

MindMazeGame.prototype.stepUsers = function(step){
	Log()('stepUsers: ', step);

	var userIds = this.userIds, x, y, totalUsers = this.state.userCount, keepGoing = true;

	for(x = 0; x < totalUsers; ++x){
		if(UsersMap[userIds[x]].state.stopped || !UsersMap[userIds[x]].state.steps[step]){
			keepGoing = false;
			continue;
		}

		this.updateMap(UsersMap[userIds[x]].state.steps[step], UsersMap[userIds[x]].state.color);

		for(y = 0; y < totalUsers; ++y){
			if(x !== y && UsersMap[userIds[y]].state.steps[step] && UsersMap[userIds[x]].state.steps[step].x === UsersMap[userIds[y]].state.steps[step].x && UsersMap[userIds[x]].state.steps[step].y === UsersMap[userIds[y]].state.steps[step].y){
				keepGoing = false;
				UsersMap[userIds[x]].state.stopped = true;
				UsersMap[userIds[y]].state.stopped = true;

				this.updateMap(UsersMap[userIds[x]].state.steps[step], 'hsl(0, 0%, 0%)');
			}
		}
	}

	++this.state.mapUpdate;

	return keepGoing;
};

MindMazeGame.prototype.generateMap = function(size){
	for(var x = 0; x < size; ++x){
		this.state.map[x] = [];

		for(var y = 0; y < size; ++y){
			this.state.map[x][y] = 0;
		}
	}

	++this.state.mapUpdate;
};

MindMazeGame.prototype.updateMap = function(position, property){
	this.state.map[position.x][position.y] = property;
};

module.exports = MindMazeGame;