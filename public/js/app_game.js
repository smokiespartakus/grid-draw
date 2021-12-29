const vueApp = new Vue({
	el: '#app',
	data: {
		loading: false,
		gameId: gameId,
		enabled: false,
		modalNameShow: false,
		name: '',
		toastText: '',
		toastTimeout: null,
		toastError: '',
		pointsActive: false,
		tilesActive: false,
		activePoint: null,
		activeElement: null,
		drawType: null,
		draw: {
			lines: false,
			boxes: false,
			circles: false,
			character: false,
		},
		drawTextValue: '',
		drawTextError: '',
		drawCharacterName: '',
		drawCharacterInitials: '',
		drawCharacterColor: null,
		drawCharacterError: null,
		characterColors: [
			{fill: '#ff9', stroke: '#bb5'},
			{fill: 'rgb(255 209 153)', stroke: 'rgb(187 155 85)'},
			{fill: 'rgb(255 162 153)', stroke: 'rgb(187 108 85)'},
			{fill: '#ff99ca', stroke: '#bb5485'},
			{fill: '#c099ff', stroke: '#7b54bb'},
			{fill: '#99afff', stroke: '#546abb'}, //227
			{fill: '#99d1ff', stroke: 'hsl(207 43% 53% / 1)'}, // 207
			{fill: '#99f3ff', stroke: 'hsl(187 43% 53% / 1)'},// 187
			{fill: '#99ffc7', stroke: 'hsl(147 43% 53% / 1)'}, // 147
			// {fill: '#ff9', stroke: '#bb5'},
		],
		characterFontSize: 24,
		characterRadius: 21,
		menuShow: false,
		canvas: null,
		canvasW: 0,
		canvasH: 0,
		gridSize: 50,
		paddingOuter: 0.5,
		textFontSize: 20,
		tooltipTarget: null,
		tooltipLeft: 0,
		tooltipTop: 0,
		history: [],
		// auto made
		grid: [],
		tiles: [],
		points: [],
		// made by user
		lines: [],
		boxes: [],
		circles: [],
		characters: [],
		texts: [],
	},
	methods: {
		pointClick(index) {
			const point = this.points[index];
			if (!point) {
				console.warn('point not found', index);
				return;
			}
			this.activeElement = null;
			let nothingHappened = true;
			switch(this.drawType) {
				case 'lines':
					if (this.activePoint && this.activePoint != point) {
						this.addLine(this.activePoint, point);
						this.activePoint = point;
						nothingHappened = false;
					}
					break;
				case 'text':
					if (!this.drawTextValue) {
						this.menuError = 'Text required before placing.';
						return;
					}
					this.addElement(this.texts, {t:'text', x: point.x, y: point.y, text: this.drawTextValue});
					nothingHappened = false;
					break;
				case 'character':
					if (!this.drawCharacterName || !this.drawCharacterInitials) {
						this.menuError = 'Name and initials required before placing.';
						return null;
					}
					this.addElement(this.characters, {t:'character', x: point.x, y: point.y, initials: this.drawCharacterInitials, name: this.drawCharacterName});
					nothingHappened = false;
					break;
			}
			if (nothingHappened) {
				if (this.activePoint) {
					this.activePoint = null;
				} else {
					this.activePoint = point;
				}
			}

		},
		tileClick(index) {
			const tile = this.tiles[index];
			if (!tile) {
				console.warn('tile not found', index);
				return;
			}
			if (this.draw.character) {
				if (!this.drawCharacterName || !this.drawCharacterInitials || !this.drawCharacterColor) {
					this.drawCharacterError = 'Name, initials and Colour required.';
					return;
				}
				this.addElement(this.characters, {
					t: 'character',
					color: this.drawCharacterColor,
					name: this.drawCharacterName,
					initials: this.drawCharacterInitials,
					tile: tile,
				});
				this.drawCharacterColor = null;
				this.drawCharacterName = null;
				this.drawCharacterInitials = null;
			}
			else if (this.activeElement && this.activeElement.t == 'character') {
				console.log('fissi!')
				this.activeElement.tile = tile;
			}

		},
		textClick(event) {
			const index = parseInt(event.target.getAttribute('data-key'));
			this.tilesActive = false;
			this.pointsActive = false;
			this.activePoint = null;
			if (this.activeElement != this.texts[index])
				this.activeElement = this.texts[index];
			else
				this.activeElement = null;
			// console.log(event, event.target.getAttribute('data-type'), event.target.getAttribute('data-key'));
		},
		lineClick(index) {
			const line = this.lines[index];
			if (!line) {
				console.warn('line not found', index);
				return;
			}
			this.activePoint = null;
			// if (this.activePoint && this.activePoint != point) {
			// this.addLine(this.activePoint, point);
			// }
			if (this.activeElement != line)
				this.activeElement = line;
			else
				this.activeElement = null;
		},
		characterClick(index) {
			const char = this.characters[index];
			if (!char) {
				console.warn('charater not found', index);
				return;
			}
			this.drawBtnClick('unset');
			if (this.activeElement == char) {
				this.activeElement = null;
				this.tilesActive = false;
			} else {
				this.activeElement = char;
				this.tilesActive = true;
			}
		},
		elementClick(event) {
			// Could be used, but feels like there are separate options by element type
			const index = parseInt(event.target.getAttribute('data-key'));
			const type = event.target.getAttribute('data-type');
			let elements;
			switch (type) {
				case 'text': elements = this.texts; break;
				case 'line': elements = this.lines; break;
				case 'character': elements = this.characters; break;
			}
			if (!elements) {
				console.warn('elements not found', type);
				return;
			}
			const element = elements[index];
			if (!element) {
				console.warn('element not found', type, index);
			}
			this.activePoint = null;
			if (this.activeElement != element)
				this.activeElement = element;
			else
				this.activeElement = null;
		},
		drawBtnClick(type) {
			for (let key of Object.keys(this.draw)) {
				if (key !== type) this.$set(this.draw, key, false);
			}
			this.tilesActive = false;
			this.pointsActive = false;
			this.activePoint = null;
			if (this.draw[type]) {
				this.drawType = type;
				switch (type) {
					case 'lines':
					case 'boxes':
					case 'circles':
					case 'text':
						this.pointsActive = true;
						break;
					case 'character':
						this.tilesActive = true;
						break;
				}
			} else {
				this.drawType = null;
			}
		},
		addLine(p1, p2) {
			this.addElement(this.lines, {t:'line', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y});
		},
		characterNameKeyUp() {
			if (this.drawCharacterName) {
				this.drawCharacterInitials = this.drawCharacterName.substr(0,2).toUpperCase();
			}
		},
		addElement(list, elem) {
			list.push(elem);
			this.historyAdd(elem);
		},
		setName() {
			if (this.name) {
				Websocket.send({cmd: 'set-name', name: this.name});
			}
		},
		createGrid() {
			const canvas = this.canvas;
			const h = canvas.offsetHeight;
			const w = canvas.offsetWidth;
			const padding = this.paddingOuter;
			const gridSize = this.gridSize;
			const grid = [];
			let hh = padding * gridSize;
			while (hh < h) {
				grid.push({t: 'grid', x1: 0, x2: w, y1: hh, y2: hh})
				hh+=gridSize;
			}
			let ww = padding * gridSize;
			while (ww < w) {
				grid.push({t: 'grid', x1: ww, x2: ww, y1: 0, y2: h})
				ww+=gridSize;
			}
			this.$set(this, 'grid', grid);
		},
		createGridPoints() {
			const canvas = this.canvas;
			const h = canvas.offsetHeight;
			const w = canvas.offsetWidth;
			const padding = this.paddingOuter;
			const gridSize = this.gridSize;
			const pointRadius = 5;
			const pointsPerTile = 4;
			const points = [];
			let hh = padding * gridSize;
			while (hh < h) {
				let ww = padding * gridSize;
				while (ww < w) {
					points.push({t: 'point', x: ww, y: hh, r: pointRadius})
					ww+=gridSize / pointsPerTile;
				}
				hh+=gridSize / pointsPerTile;
			}
			this.$set(this, 'points', points);
			// this.points = points;
		},
		createGridTiles() {
			const canvas = this.canvas;
			const h = canvas.offsetHeight;
			const w = canvas.offsetWidth;
			const padding = this.paddingOuter;
			const tilePadding = 5;
			const gridSize = this.gridSize;
			const tiles = [];
			let hh = padding * gridSize;
			const tileSize = gridSize - 2 * tilePadding;
			while (hh < h) {
				let ww = padding * gridSize;
				while (ww < w) {
					tiles.push({t: 'tile', x: ww, y: hh, r: tileSize, pad: tilePadding})
					ww+=gridSize;
				}
				hh+=gridSize;
			}
			this.$set(this, 'tiles', tiles);
		},
		historyAdd(elem) {
			this.history.push({action: 'add', elem: elem});
		},
		historyDelete(elem) {
			this.history.push({action: 'delete', elem: elem});
		},
		historyPop() {
			const action = this.history.pop();
			if (!action) return;
			const list = this.getElementArray(action.elem);
			if (!list) return;
			this.activeElement = null;
			this.activePoint = null;
			switch (action.action) {
				case 'add':
					this.removeElement(list, action.elem);
					break;
				case 'delete':
					list.push(action.elem);
					break;
			}
		},
		getElementArray(elem) {
			if (!elem) return null;
			switch(elem.t) {
				case 'line': return this.lines;
				case 'text': return this.texts;
				case 'character': return this.characters;
				case 'circle': return this.circles;
				case 'box': return this.boxes;
			}
			return null;
		},
		removeElement(list, elem) {
			list.splice(0, list.length, ...list.filter(e => e != elem));
		},
		clearElements() {
			// @todo history
			this.lines.splice(0, this.lines.length);
			this.boxes.splice(0, this.boxes.length);
			this.texts.splice(0, this.texts.length);
			this.circles.splice(0, this.circles.length);
		},
		clearCharacters() {
			// @todo history
			this.characters.splice(0, this.characters.length);
		},
		setElements(data) {
			console.log('set elements', data);
			if (!data) return;
			if (data.lines) this.lines.splice(0, this.lines.length, ...data.lines);
			if (data.characters) this.characters.splice(0, this.characters.length, ...data.characters);
			if (data.texts) this.texts.splice(0, this.texts.length, ...data.texts);
			// set elements
			// set history? or should it only be yours
		},
		onOpen() {
			Websocket.send({cmd:'join', gameId: this.gameId});
		},
		onClose() {

		},
		onMessage(msg) {
			console.log('message', msg);
			if (msg.fail) this.onFail(msg);
			else {
				switch(msg.success) {
					case 'join':
						this.modalNameShow = true;
						break;
					case 'set-name':
						this.modalNameShow = false;
						this.enabled = true;
						this.runToast('Welcome, ' + msg.name);
						break;
				}
			}
		},
		onFail(msg) {
			this.toastError = msg.err;
		},
		runToast(text, error) {
			clearTimeout(this.toastTimeout);
			if (error) {
				this.toastText = '';
				this.toastError = text;
				this.toastTimeout = setTimeout(() => {
					this.toastError = '';
				}, 3000);
			} else {
				this.toastError = '';
				this.toastText = text;
				this.toastTimeout = setTimeout(() => {
					this.toastText = '';
				}, 3000);
			}

		},
		characterMouseOver(event) {
			// this.tooltip = name;
			if (this.tooltipTarget) return;
			const rect = event.target.getBoundingClientRect();
			this.tooltipTarget = event.target;
			this.tooltipLeft = rect.left + rect.width/2;
			this.tooltipTop = rect.top - 30;
			this.$nextTick(() => {
				const tooltip = document.getElementById('tooltip');
				const ttrect = tooltip.getBoundingClientRect();
				this.tooltipLeft = rect.left + event.target.getBoundingClientRect().width/2 - ttrect.width/2;
			});
			// console.log('IN', event.clientX, event.clientY, event.target.getBoundingClientRect(), event.target);
		},
		characterMouseOut(event) {
			this.tooltipTarget = null;
			// console.log('Out', event.clientX, event.clientY, event.target);
		},
	},
	mounted() {
		this.canvas = document.getElementById('canvas');
		this.canvasH = canvas.offsetHeight;
		this.canvasW = canvas.offsetWidth;
		this.createGrid();
		this.createGridPoints();
		this.createGridTiles();
		// this.enabled = true;
		this.loading = true;
		Websocket.connect({
			debug: true,
			autoReconnect: true,
			onopen: () => {this.onOpen();},
			onclose: () => {this.onClose();},
			onmessage: (message) => {this.onMessage(message);},
		});
		if (data) this.setElements(data);
		this.addElement(this.characters, {
			t: 'character',
			name: 'Jonas',
			initials: 'JO',
			tile: this.tiles[10],
			color: this.characterColors[1],
		});
		this.addElement(this.characters, {
			t: 'character',
			name: 'Jonas',
			initials: 'JO',
			tile: this.tiles[28],
			color: this.characterColors[7],
		});
		this.addElement(this.characters, {
			t: 'character',
			name: 'Jonas',
			initials: 'JO',
			tile: this.tiles[173],
			color: this.characterColors[3],
		});
		this.addElement(this.texts, {x: 40, y: 40, text: 'Fissi', t: 'text'});
		// @todo get name from localstorage
		document.addEventListener('keyup', (event) => {
			switch(event.code) {
				case 'Delete': // delete
					if (this.activeElement) {
						switch (this.activeElement.t) {
							case 'line':
								this.removeElement(this.lines, this.activeElement);
								break;
							case 'text':
								this.removeElement(this.texts, this.activeElement);
								break;
							case 'character':
								this.removeElement(this.characters, this.activeElement);
								break;
						}
						this.historyDelete(this.activeElement);
						this.activeElement = null;
					}
				case 'Escape': // escape
					if (this.activeElement) {
						this.tilesActive = false;
						this.pointsActive = false;
					}
					this.activeElement = null;
					this.activePoint = null;
					break;
				case 'KeyZ': //z
					if (event.ctrlKey) this.historyPop();
					break;
			}
			console.log(event.key, event.code, event.keyCode, event);
		});
	},
});
