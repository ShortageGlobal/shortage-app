document.addEventListener('DOMContentLoaded', function() {
	function getPair() {
		console.log(window.product_id);
		
		if(!window.product_id) return;

		fetch('https://device-months-parcel-magazines.trycloudflare.com/getPair?prod='+ window.product_id).then(res => res.json()).then(data => {
			console.log("🚀 ~ data:", data);
			if(data) injectButton();
		})
	}

	function injectButton() {
		document.querySelector('.wallet-button-fade-in').appendChild(Object.assign(document.createElement('button'), {
			innerHTML: 'Donate this',
			id: 'newButtonId',
			className: 'my-custom-class',
			style: 'width: 100%; background: darkorange; border: navajowhite; line-height: 40px; margin-top: 20px; font-size: 14px;cursor: pointer;',
			onclick: () => alert('Button Clicked!')
		}));
	}

	getPair();
}); 