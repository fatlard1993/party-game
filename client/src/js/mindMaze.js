var Loaded = false;

function Load(){
	if(Loaded) return;

	Loaded = true;

	const ws = new WebSocket('ws://'+ location.host +'/api');

	const gameStatus = document.getElementById('status');
	const gameGrid = document.getElementById('grid');
	const gameAction = document.getElementById('action');

	var user = {
		moves: []
	};
	var game = {};

	function clearNextHighlights(){
		var oldHighlights = Array.prototype.slice.call(document.body.getElementsByClassName('next'));

		for(var x = 0, count = oldHighlights.length; x < count; ++x){
			oldHighlights[x].className = '';
		}
	}

	function highlightNextSpaces(pos){
		clearNextHighlights();

		var filter = { start: 1, last: 1, goal: 1 };

		if(game.grid[pos.x + 1] && game.grid[pos.x + 1][pos.y] && !filter[game.grid[pos.x + 1][pos.y].className]) game.grid[pos.x + 1][pos.y].className = 'next';
		if(game.grid[pos.x - 1] && game.grid[pos.x - 1][pos.y] && !filter[game.grid[pos.x - 1][pos.y].className]) game.grid[pos.x - 1][pos.y].className = 'next';
		if(game.grid[pos.x][(pos.y + 1)] && !filter[game.grid[pos.x][(pos.y + 1)].className]) game.grid[pos.x][(pos.y + 1)].className = 'next';
		if(game.grid[pos.x][(pos.y - 1)] && !filter[game.grid[pos.x][(pos.y - 1)].className]) game.grid[pos.x][(pos.y - 1)].className = 'next';
	}

	ws.reply = function(type, payload){
		ws.send(JSON.stringify({ type, payload }));
	};

	ws.addEventListener('open', function(evt){
		// console.log('Websocket connection open: ', evt);

		gameStatus.textContent += '.';

		ws.reply('knock', localStorage.id);
	});

	ws.addEventListener('message', function(evt){
		console.log('Message from server: ', evt.data);

		var data = JSON.parse(evt.data);

		if(data.type === 'userState'){
			user = Object.assign(user, data.payload);

			console.log(user);

			if(user.id) localStorage.id = user.id;

			if(user.score){
				console.log('Score: ', user.score);
			}

			if(game.gridSize && data.payload.startingPosition){
				gameGrid.children[user.startingPosition.x + (user.startingPosition.y * game.gridSize)].className = 'start';

				highlightNextSpaces(user.startingPosition);
			}
		}

		else if(data.type === 'gameState'){
			game = Object.assign(game, data.payload);

			console.log(game);

			if(game.stage) gameStatus.textContent = game.stage;
			if(game.action) gameAction.textContent = game.action;

			if(data.payload.gridSize){
				var gridPxSize = Math.min(600, Math.round(document.body.clientWidth * 0.8));

				gameGrid.style.width = gameGrid.style.height = gridPxSize +'px';

				game.grid = [];

				for(var y = 0, yCount = game.gridSize; y < yCount; ++y){
					for(var x = 0, xCount = game.gridSize; x < xCount; ++x){
						game.grid[x] = game.grid[x] || [];

						var gridPoint = document.createElement('div');
						gridPoint.style.width = gridPoint.style.height = (gridPxSize / game.gridSize) +'px';
						gameGrid.appendChild(gridPoint);

						gridPoint.setAttribute('position', x +' '+ y);

						game.grid[x][y] = gridPoint;
					}
				}

				game.grid[Math.floor(game.gridSize / 2)][Math.floor(game.gridSize / 2)].className = 'goal';

				if(user.startingPosition){
					game.grid[user.startingPosition.x][user.startingPosition.y].className = 'start';

					highlightNextSpaces(user.startingPosition);
				}
			}

			if(game.winner){
				if(game.winner === user.id) gameStatus.textContent = 'WINNER';
				else gameStatus.textContent = 'LOSER';
			}
		}
	});

	function onPointerUp(evt){
		// console.log('onPointerUp', evt);

		if(evt.target.id === 'action') ws.reply('gameAction', evt.target.textContent);

		else if(evt.target.className === 'next'){
			evt.target.className = 'last';

			var position = evt.target.getAttribute('position').split(' ');
			position = { x: parseInt(position[0]), y: parseInt(position[1]) };

			user.moves.push(position);//todo replace with server side tracking
			ws.reply('userSetMove', position);

			highlightNextSpaces(position);
		}
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
}

document.addEventListener('DOMContentLoaded', Load);