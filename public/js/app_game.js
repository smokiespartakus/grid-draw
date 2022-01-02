const vueApp = new Vue({
	el: '#app',
	data: {
		style: 'normal',
		role: 'player',
		roles: {
			'player': 'Player',
			'gm': 'Game Master',
		},
		styles: {
			normal: 'Normal',
			fantasy: 'Fantasy',
			scifi: 'Sci-Fi',
		},
		loading: false,
		gameId: gameId,
		enabled: false,
		connected: false,
		width: 5,
		height: 5,
		masksShow: true,
		modalNameShow: false,
		modalInfoShow: false,
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
			masks: false,
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
		menuShow: false,
		canvas: null,
		gridW: 0,
		gridH: 0,
		gridSize: 50,
		marginCanvas: 20,
		paddingOuterFactor: 0.5,
		paddingTileFactor: 0.1,
		textFontSize: 20,
		tooltipTarget: null,
		tooltipLeft: 0,
		tooltipTop: 0,
		maskDrawRect: {x: 0, y: 0, h: 0, w: 0},
		history: [],
		// auto made
		users: [],
		grid: [],
		tiles: [],
		points: [],
		// made by user
		lines: [],
		boxes: [],
		circles: [],
		characters: [],
		texts: [],
		masks: [],
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
				case 'masks':
					if (this.activePoint && this.activePoint != point) {
						const x = Math.min(point.x, this.activePoint.x);
						const y = Math.min(point.y, this.activePoint.y);
						const w = Math.abs(point.x - this.activePoint.x);
						const h = Math.abs(point.y - this.activePoint.y);
						this.addElement(this.masks, {t:'mask', x: x, y: y, width: w, height: h });
						this.activePoint = null;
						nothingHappened = false;
					}
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
		pointMouse(index) {
			const point = this.points[index];
			if (!point) {
				console.warn('point not found', index);
				return;
			}
			if (this.drawType == 'masks') {
				if (this.activePoint) {
					this.maskDrawRect = {
						x: Math.min(point.x, this.activePoint.x),
						y: Math.min(point.y, this.activePoint.y),
						w: Math.abs(point.x - this.activePoint.x),
						h: Math.abs(point.y - this.activePoint.y),
					};
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
				this.activeElement.tile = tile;
				Websocket.send({cmd: 'update', elem: this.activeElement});
				this.activeElement = null;
				this.tilesActive = false;
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
		maskClick(index) {
			const mask = this.masks[index];
			if (!mask) {
				console.warn('mask not found', index);
				return;
			}
			this.drawBtnClick('unset');
			if (this.activeElement == mask) {
				this.activeElement = null;
				this.tilesActive = false;
			} else {
				this.activeElement = mask;
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
			this.maskStartPoint = null;
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
					case 'masks':
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
		setName() {
			if (this.name) {
				Websocket.send({cmd: 'set-name', name: this.name});
				localStorage.setItem('grid-player-name', this.name);
			}
		},
		getVal(val) {
			return (this.paddingOuterFactor + val) * this.gridSize;
		},
		getDist(val) {
			return val * this.gridSize;
		},
		initGrid(width, height) {
			this.width = width;
			this.height = height;
			this.canvas = document.getElementById('canvas');
			const canvasH = canvas.offsetHeight;
			const canvasW = canvas.offsetWidth;
			const tileSizeH = Math.floor((canvasH - this.marginCanvas * 2) / (this.height + 2 * this.paddingOuterFactor));
			const tileSizeW = Math.floor((canvasW - this.marginCanvas * 2) / (this.width + 2 * this.paddingOuterFactor));
			console.log('zzzzzz',this.height, this.width, canvasW, canvasH, tileSizeW, tileSizeH);
			this.gridSize = Math.min(tileSizeH, tileSizeW);
			this.gridH = this.gridSize * (this.height + 2 * this.paddingOuterFactor);
			this.gridW = this.gridSize * (this.width + 2 * this.paddingOuterFactor);
			this.createGrid();
			this.createGridPoints();
			this.createGridTiles();
		},
		createGrid() {
			const grid = [];
			for (let h=0; h<=this.height; h++) {
				grid.push({t: 'grid', x1: -1 * this.paddingOuterFactor, x2: this.gridW, y1: h, y2: h})
			}
			for (let w=0; w<=this.width; w++) {
				grid.push({t: 'grid', x1: w, x2: w, y1: -1 * this.paddingOuterFactor, y2: this.gridH})
			}
			this.$set(this, 'grid', grid);
		},
		createGridPoints() {
			const pointRadius = 5;
			const pointsPerTile = 4;
			const points = [];
			for (let h=0; h<=this.height; h+=1/pointsPerTile) {
				for (let w=0; w<=this.width; w+=1/pointsPerTile) {
					points.push({t: 'point', x: w, y: h, r: pointRadius})
				}
			}
			this.$set(this, 'points', points);
			// this.points = points;
		},
		createGridTiles() {
			const tiles = [];
			for (let h=0; h<this.height; h++) {
				for (let w=0; w<this.width; w++) {
					tiles.push({t: 'tile', x: w, y: h})
				}
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
					// @todo missing id on the history elements
					this.removeElement(list, action.elem, false);
					break;
				case 'delete':
					// @todo missing id on the history elements
					this.addElement(list, action.elem, false);
					// list.push(action.elem);
					break;
			}
		},
		historyId(id) {
			if (!this.history.length) return;
			const action = this.history[this.history.length - 1];
			if (action && !action.elem.id) action.elem.id = id;
		},
		getElementArray(elem) {
			if (!elem) return null;
			switch(elem.t) {
				case 'line': return this.lines;
				case 'text': return this.texts;
				case 'character': return this.characters;
				case 'circle': return this.circles;
				case 'box': return this.boxes;
				case 'mask': return this.masks;
			}
			return null;
		},
		addElement(list, elem, history=true) {
			list.push(elem);
			if (history) this.historyAdd(elem);
			Websocket.send({cmd: 'add', elem: elem});
		},
		removeElement(list, elem, history=true) {
			list.splice(0, list.length, ...list.filter(e => e != elem));
			if (history) this.historyDelete(elem);
			Websocket.send({cmd: 'remove', elem: elem});
		},
		clearElements() {
			// @todo history
			this.lines.splice(0, this.lines.length);
			this.boxes.splice(0, this.boxes.length);
			this.texts.splice(0, this.texts.length);
			this.circles.splice(0, this.circles.length);
			// @todo server
			// Websocket.send({cmd: 'clear-elements'});
		},
		clearCharacters() {
			// @todo history
			this.characters.splice(0, this.characters.length);
			// @todo server
			// Websocket.send({cmd: 'clear-characters'});
		},
		setElements(elements) {
			console.log('set elements', elements);
			if (!elements) return;
			let elem;
			const lines = [];
			const characters = [];
			const texts = [];
			const boxes = [];
			const circles = [];
			const masks = [];
			for (elem of elements) {
				switch (elem.t) {
					case 'line': lines.push(elem); break;
					case 'character': characters.push(elem); break;
					case 'text': texts.push(elem); break;
					case 'box': boxes.push(elem); break;
					case 'circle': circles.push(elem); break;
					case 'mask': masks.push(elem); break;
				}
			}
			this.lines.splice(0, this.lines.length, ...lines);
			this.characters.splice(0, this.characters.length, ...characters);
			this.texts.splice(0, this.texts.length, ...texts);
			this.boxes.splice(0, this.boxes.length, ...boxes);
			this.circles.splice(0, this.circles.length, ...circles);
			this.masks.splice(0, this.masks.length, ...masks);
			// set history? or should it only be yours
		},
		onOpen() {
			Websocket.send({cmd:'join', gameId: this.gameId});
		},
		onClose() {
			this.connected = false;
			this.toastError = 'Disconnected!';
		},
		onMessage(msg) {
			console.log('message', msg);
			if (msg.fail) this.onFail(msg);
			else {
				switch(msg.action) {
					case 'join':
						this.connected = true;
						if (!this.name) {
							this.modalNameShow = true;
						} else {
							this.setName();
						}
						this.initGrid(msg.game.width, msg.game.height);
						// this.addStartElements();
						break;
					case 'set-name':
						this.modalNameShow = false;
						this.enabled = true;
						this.runToast('Welcome, ' + msg.name);
						break;
					case 'update':
						this.setElements(msg.elements);
						this.users.splice(0, this.users.length, ...msg.users);
						break;
					case 'element-id':
						this.historyId(msg.id);
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
		tooltipMouseOver(event) {
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
		tooltipMouseOut(event) {
			this.tooltipTarget = null;
			// console.log('Out', event.clientX, event.clientY, event.target);
		},
		addStartElements() {
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
		},
		connect() {
			Websocket.connect({
				debug: true,
				autoReconnect: true,
				onopen: () => {this.onOpen();},
				onclose: () => {this.onClose();},
				onmessage: (message) => {this.onMessage(message);},
			});
		},
	},
	mounted() {
		this.name = localStorage.getItem('grid-player-name') || null;
		this.style = localStorage.getItem('grid-style') || 'normal';
		// this.enabled = true;
		this.loading = true;
		this.connect();
		// if (data) this.setElements(data);
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
							case 'mask':
								this.removeElement(this.masks, this.activeElement);
								break;
						}
						this.activeElement = null;
					}
				case 'Escape': // escape
					if (this.activePoint) {
						this.activePoint = null;
					} else if(this.activeElement) {
						this.activeElement = null;
					} else {
						this.tilesActive = false;
						this.pointsActive = false;
					}
					break;
				case 'KeyZ': //z
					if (event.ctrlKey) this.historyPop();
					break;
			}
			// console.log(event.key, event.code, event.keyCode, event);
		});
	},
	watch: {
		style (val) {
			localStorage.setItem('grid-style', val);
		},
	},
});
