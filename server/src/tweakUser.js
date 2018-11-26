const { User, Constants, UsersMap, Log } = require('byod-game-engine');
const localConstants = require('./constants');

Object.assign(Constants, localConstants);

module.exports = class TweakUser extends User {
	constructor(socketServer, socket, game){
		super(socketServer, socket);

		this.gameId = game.id;

		this.reset = () => {
			this.state.score = 0;
			this.state.penalty = 0;

			this.checkLatency();
		};

		this.checkLatency = () => {
			this.state.latencyCheckStart = new Date().getTime();

			socket.reply(Constants.USER_LATENCY_CHECK);
		};

		socketServer.on(Constants.USER_LATENCY_CHECK, () => {
			this.state.latency = new Date().getTime() - this.state.latencyCheckStart;
		});

		this.reset();
	}
};