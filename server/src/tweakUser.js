const { User } = require('byod-game-engine');
const Constants = require('./constants');

class TweakUser extends User {
	constructor(socketServer, socket, game){
		super(socketServer, socket, game);

		game.on(Constants.USER_LATENCY_CHECK, () => {
			this.state.latency = new Date().getTime() - this.state.latencyCheckStart;
		});

		this.reset();
	}
}

TweakUser.prototype.reset = function(){
	this.state.score = 0;
	this.state.penalty = 0;

	this.checkLatency();
};

TweakUser.prototype.checkLatency = function(){
	this.state.latencyCheckStart = new Date().getTime();

	this.socket.reply(Constants.USER_LATENCY_CHECK);
};

module.exports = TweakUser;