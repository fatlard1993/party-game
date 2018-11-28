var Loaded = false;

function Load(){
	if(Loaded) return;

	Loaded = true;

	const ws = new WebSocket('ws://'+ location.host +'/api');

	const gameStatus = document.getElementById('status');
	const gameGrid = document.getElementById('grid');
	const gameAction = document.getElementById('action');

	var user = {};
	var game = {};

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

			if(data.payload.startingPosition){
				//todo highlight starting position and next availible positions
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

				for(var x = 0, count = (game.gridSize * game.gridSize); x < count; ++x){
					var gridPoint = document.createElement('div');
					gridPoint.style.width = gridPoint.style.height = (gridPxSize / game.gridSize) +'px';
					gameGrid.appendChild(gridPoint);
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
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
}

document.addEventListener('DOMContentLoaded', Load);