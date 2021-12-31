new Vue({
	el: '#app',
	data: {
		gameId: '',
		width: 16,
		height: 12,
	},
	methods: {
		async create() {
			console.log('create', this.height, this.width);
			if (this.height <= 0 || this.width <= 0) return;
			const response = await axios.post('/action/create', {w: this.width, h: this.height});
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