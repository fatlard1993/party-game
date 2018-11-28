var Loaded = false;

function Load(){
	if(Loaded) return;

	Loaded = true;

	function onPointerUp(evt){
		// console.log('onPointerUp', evt);

		if(evt.target.nodeName === 'BUTTON') window.location.href = '/game/'+ evt.target.textContent;
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
}

document.addEventListener('DOMContentLoaded', Load);