var Loaded = false;

function Load(){
	if(Loaded) return;

	Loaded = true;

	const ws = new WebSocket('ws://'+ location.host +'/api');

	const gameStatus = document.getElementById('status');
	const gamesList = document.getElementById('games');

	var games = {};

	ws.reply = function(type, payload){
		ws.send(JSON.stringify({ type, payload }));
	};

	ws.addEventListener('open', function(evt){
		// console.log('Websocket connection open: ', evt);

		gameStatus.textContent += '.';

		ws.reply('gamesList');
	});

	ws.addEventListener('message', function(evt){
		console.log('Message from server: ', evt.data);

		var data = JSON.parse(evt.data);

		if(data.type === 'gamesList'){
			games = data.payload;

			var gameNames = Object.keys(games), gameCount = gameNames.length;

			gameStatus.textContent = 'GAME LOBBY - '+ gameCount +' GAME'+ (gameCount > 1 ? 'S' : '');

			for(var x = 0; x < gameCount; ++x){
				var gameItem = document.createElement('li');
				gameItem.textContent = gameNames[x];
				gameItem.setAttribute('data-game', games[gameNames[x]].game);

				gamesList.appendChild(gameItem);
			}
		}
	});

	function onPointerUp(evt){
		// console.log('onPointerUp', evt);

		if(evt.target.nodeName === 'LI'){
			localStorage.gameId = games[evt.target.textContent].id;

			window.location.href = '/game/'+ evt.target.getAttribute('data-game');
		}
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
}

document.addEventListener('DOMContentLoaded', Load);