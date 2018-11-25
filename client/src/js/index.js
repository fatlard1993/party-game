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

	ws.json = function(data){
		ws.send(JSON.stringify(data));
	};

	ws.addEventListener('open', function(evt){
		console.log('Websocket connection open: ', evt);

		gameStatus.textContent += '.';

		ws.json({ type: 'knock', user: { id: localStorage.id } });
	});

	ws.addEventListener('message', function(evt){
		console.log('Message from server: ', evt.data);

		var data = JSON.parse(evt.data);

		if(data.type === 'welcome'){
			gameStatus.textContent = 'CONNECTED';
			gameButton.textContent = 'START';

			localStorage.id = data.user.id;
			user = data.user;
			game = data.game;

			ws.json({ type: 'latencyCheck' });
		}

		else if(data.type === 'gameOver'){
			if(data.winner === user.id) gameStatus.textContent = 'WINNER';
			else gameStatus.textContent = 'LOSER';

			gameButton.textContent = 'RESTART';
		}

		else if(data.type === 'userState' && data.id === user.id){
			user = Object.assign(user, data.state);

			console.log(user);

			if(user.gameTime){
				gameStatus.textContent = (user.gameTime / 1000) +'s';
				gameButton.textContent = '';
			}
		}

		else if(data.type === 'gameState'){
			game = Object.assign(game, data.state);

			console.log(game);

			if(data.state.ready){
				gameStatus.textContent = 'READY';
				gameButton.textContent = 'GO';
			}
		}
	});

	function onPointerUp(evt){
		console.log('onPointerUp', evt);

		if(evt.target.id === 'action'){
			if(evt.target.textContent === 'GO')	ws.json({ type: 'GO' });

			else if({ START: 1, RESTART: 1 }[evt.target.textContent]){
				ws.json({ type: evt.target.textContent });

				gameStatus.textContent = 'WAITING';
				gameButton.textContent = '';
			}
		}
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
}

document.addEventListener('DOMContentLoaded', Load);