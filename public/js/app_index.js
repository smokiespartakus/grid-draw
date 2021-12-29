new Vue({
	el: '#app',
	data: {
		gameId: '',
	},
	methods: {
		async create() {
			const response = await axios.post('/action/create', {});
			console.log('response', response.data);
			if(response.data && response.data.gameId) {
				this.redirect(response.data.gameId);
			}

		},
		join() {
			if (this.gameId)
				this.redirect(this.gameId);
		},
		redirect(gameId) {
			location.href = '/game/' + gameId;
		},
	},
	mounted() {

	},
});