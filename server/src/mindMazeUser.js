const { User, Constants, UsersMap, Log } = require('byod-game-engine');
const localConstants = require('./constants');

Object.assign(Constants, localConstants);

module.exports = class MindMazeUser extends User {
	constructor(socketServer, socket, game){
		super(socketServer, socket);

		this.gameId = game.id;

		this.reset = () => {
			this.state.score = 0;
		};

		this.reset();
	}
};