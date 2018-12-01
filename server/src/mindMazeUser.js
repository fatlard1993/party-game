const { User } = require('byod-game-engine');

class MindMazeUser extends User {
	constructor(socketServer, socket, game){
		super(socketServer, socket);

		this.gameId = game.id;

		this.reset();
	}
}

MindMazeUser.prototype.reset = function(){
	this.state.score = 0;
	this.state.steps = [];
};

module.exports = MindMazeUser;