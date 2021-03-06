var Loaded = false;

function Load(){
	if(Loaded) return;

	Loaded = true;

	const ws = new WebSocket('ws://'+ location.host +'/api');

	const gameStatus = document.getElementById('status');
	const gameInput = document.getElementById('input');
	const gameButton = document.getElementById('action');

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

		if(data.type === 'latencyCheck'){
			ws.reply('latencyCheck');
		}

		else if(data.type === 'userState'){
			user = Object.assign(user, data.payload);

			console.log(user);

			if(user.id) localStorage.id = user.id;

			if(user.score){
				gameInput.value = (user.score / 1000) +'s';
			}
		}

		else if(data.type === 'gameState'){
			game = Object.assign(game, data.payload);

			console.log(game);

			if(game.stage) gameStatus.textContent = game.stage;
			if(game.action) gameButton.textContent = game.action;

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