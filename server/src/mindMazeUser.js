const { User, Log, Cjs } = require('byod-game-engine');

class MindMazeUser extends User {
	constructor(socketServer, socket, game){
		super(socketServer, socket, game);

		this.state.on('change', (event, property, value) => {
			Log()('(mindMaze) User state change - ', property, value);

			if(property === 'name') this.state.color = Cjs.stringToColor(value);
		});

		this.state.name = this.id;

		this.reset();
	}
}

MindMazeUser.prototype.reset = function(){
	this.state.score = 0;
	this.state.steps = [];
};

module.exports = MindMazeUser;