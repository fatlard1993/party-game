const { Game, Log, Cjs, UsersMap } = require('byod-game-engine');
const Constants = require('./constants');
const TweakUser = require('./tweakUser');

class TweakGame extends Game {
	constructor(socketServer){
		super(socketServer);

		this.name = 'tweak';
		this.user = TweakUser;

		this.reset();

		this.on(Constants.USER_JOIN_GAME, (userId, socket) => {
			if(this.state.stage.startsWith('WAITING ROOM')) this.state.stage = `WAITING ROOM - ${this.state.userCount} PLAYER${this.state.userCount > 1 ? 'S' : ''}`;
		});

		this.on(Constants.USER_GAME_ACTION, (action, socket) => {
			var userIds = this.state.activeUserIds, x, totalUsers = userIds.length;

			if(action === Constants.GAME_ACTION_START) this.start();

			else if(action === Constants.GAME_ACTION_WAIT){
				UsersMap[socket.id].state.penalty += 100;

				Log.error()('Penalty: ', UsersMap[socket.id].state.penalty);
			}

			else if(action === Constants.GAME_ACTION_NOW && !UsersMap[socket.id].state.score){
				UsersMap[socket.id].state.score = ((new Date().getTime() - UsersMap[socket.id].state.latency) - this.state.ready) + UsersMap[socket.id].state.penalty;

				Log.info()('Score: ', UsersMap[socket.id].state.score);

				UsersMap[socket.id].state.done = true;

				var allUsersDone = true;

				for(x = 0; x < totalUsers; ++x){
					if(!UsersMap[userIds[x]].state.done) allUsersDone = false;
				}

				if(allUsersDone) this.end();
			}

			else if(action === Constants.GAME_ACTION_RESET){
				this.reset();

				UsersMap[socket.id].reset();
			}
		});
	}
}

TweakGame.prototype.reset = function(){
	this.state.winner = '';
	this.state.action = Constants.GAME_ACTION_START;
	this.state.stage = Constants.GAME_STAGE_WAITING_ROOM;
};

TweakGame.prototype.start = function(){
	this.state.stage = Constants.GAME_STAGE_STARTED;
	this.state.action = Constants.GAME_ACTION_WAIT;

	setTimeout(() => {
		this.state.action = Constants.GAME_ACTION_NOW;
		this.state.stage = Constants.GAME_STAGE_END;

		this.state.ready = new Date().getTime();
	}, Cjs.randInt(2000, 6000));
};

TweakGame.prototype.end = function(){
	Log.info()('Game over');

	var scores = [], scoreKey = {};
	var userIds = this.userIds;

	for(var x = 0, count = this.state.userCount; x < count; ++x){
		scores.push(UsersMap[userIds[x]].state.score);
		scoreKey[UsersMap[userIds[x]].state.score] = userIds[x];
	}

	this.state.scores = scores;
	this.state.scoreKey = scoreKey;
	this.state.winner = scoreKey[scores[0]];

	Log.info()(`Winner: ${this.state.winner}`);

	this.state.action = Constants.GAME_ACTION_RESET;
	this.state.stage = Constants.GAME_STAGE_GAME_OVER;
};

module.exports = TweakGame;