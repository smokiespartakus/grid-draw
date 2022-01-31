const vueApp = Vue.createApp({
// const vueApp = new Vue({
	el: '#app',
	data() {
		return {
			style: 'normal',
			role: 'gm',
			// role: 'player',
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
			activePolyLine: null,
			moveElement: null,
			drawType: null,
			draw: {
				lines: false,
				rects: false,
				circles: false,
				character: false,
				masks: false,
			},
			drawTextValue: '',
			drawTextError: '',
			drawCharacterName: '',
			drawCharacterInitials: '',
			drawCharacterCategory: 'player',
			drawCharacterColor: null,
			drawCharacterError: null,
			characterDamageEdit: 0,
			textEdit: '',
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
			playersShow: false,
			canvas: null,
			gridW: 0,
			gridH: 0,
			gridSize: 50,
			marginCanvas: 20,
			paddingOuterFactor: 0.5,
			paddingTileFactor: 0.1,
			textFontSize: 20,
			characterFontSize: 20,
			tooltipTarget: null,
			tooltipLeft: 0,
			tooltipTop: 0,
			sketchMask: {x: 0, y: 0, h: 0, w: 0},
			sketchRect: {x: 0, y: 0, h: 0, w: 0},
			sketchCircle: {x: 0, y: 0, r: 0},
			sketchLine: {x1: 0, y1: 0, x2: 0, y2: 0},
			sketchText: {x: 0, y: 0, text: ''},
			objectOptions: {},
			history: [],
			// auto made
			users: [],
			grid: [],
			tiles: [],
			points: [],
			// made by user
			lines: [],
			rects: [],
			circles: [],
			characters: [],
			texts: [],
			masks: [],
		};
	},
	methods: {
		pointClick(index) {
			if (this.role !== 'gm') return;
			const point = this.points[index];
			if (!point) {
				console.warn('point not found', index);
				return;
			}
			if (this.moveElement) {
				this.endMove();
				return;
			}
			this.activeElement = null;
			let nothingHappened = true;
			switch(this.drawType) {
				case 'lines':
					if (this.activePoint && this.activePoint != point) {
						if (!this.activePolyLine) {
							this.activePolyLine = this.getLine(this.activePoint, point, 'line');
							this.addElement(this.lines, this.activePolyLine);
						} else {
							this.activePolyLine.p.push({x: point.x, y: point.y});
							this.updateElement(this.activePolyLine);
						}
						// this.addElement(this.lines, this.getLine(this.activePoint, point, 'line'));
						this.activePoint = point;
						nothingHappened = false;
					}
					break;
				case 'text':
					if (!this.drawTextValue) {
						this.menuError = 'Text required before placing.';
						return;
					}
					this.addElement(this.texts, this.getText(point, this.drawTextValue, 'text'));
					nothingHappened = false;
					break;
				case 'masks':
					if (this.activePoint && this.activePoint != point) {
						this.addElement(this.masks, this.getRect(this.activePoint, point, 'mask'));
						this.activePoint = null;
						nothingHappened = false;
					}
					break;
				case 'rects':
					if (this.activePoint && this.activePoint != point) {
						this.addElement(this.rects, this.getRect(this.activePoint, point, 'rect'));
						this.activePoint = null;
						nothingHappened = false;
					}
					break;
				case 'circles':
					if (this.activePoint && this.activePoint != point) {
						this.addElement(this.circles, this.getCircle(this.activePoint, point, 'circle'));
						this.activePoint = null;
						nothingHappened = false;
					}
					break;
			}
			if (nothingHappened) {
				if (this.activePoint) {
					this.activePoint = null;
					this.activePolyLine = null;
				} else {
					this.activePoint = point;
				}
			}
		},
		pointMouse(index) {
			if (this.role !== 'gm') return;
			const point = this.points[index];
			if (!point) {
				console.warn('point not found', index);
				return;
			}
			if (this.moveElement) {
				this.shiftElement(this.moveElement, point);
			}
			switch(this.drawType) {
				case 'masks':
					if (this.activePoint) {
						this.sketchMask = this.getRect(this.activePoint, point);
					}
					break;
				case 'lines':
					if (this.activePoint) {
						this.sketchLine = this.getLine(this.activePoint, point);
					}
					break;
				case 'rects':
					if (this.activePoint) {
						this.sketchRect = this.getRect(this.activePoint, point);
					}
					break;
				case 'circles':
					if (this.activePoint) {
						this.sketchCircle = this.getCircle(this.activePoint, point);
					}
					break;
				case 'text':
					if (!this.drawTextValue) {
						this.menuError = 'Text required before placing.';
						return;
					}
					this.sketchText = this.getText(point, this.drawTextValue);
					break;
				default:
					break;
			}
		},
		tileClick(index) {
			const tile = this.tiles[index];
			if (!tile) {
				console.warn('tile not found', index);
				return;
			}
			if (this.draw.character) {
				if (this.role !== 'gm') return;
				if (!this.drawCharacterName || !this.drawCharacterInitials || !this.drawCharacterColor) {
					this.drawCharacterError = 'Name, initials and Colour required.';
					return;
				}
				this.addElement(this.characters, {
					t: 'character',
					color: this.drawCharacterColor,
					name: this.drawCharacterName,
					initials: this.drawCharacterInitials,
					cat: this.drawCharacterCategory,
					dam: 1, // damage
					tile: tile,
				});
				// this.drawCharacterColor = null;
				// this.drawCharacterName = null;
				// this.drawCharacterInitials = null;
			}
			else if (this.activeElement && this.activeElement.t == 'character') {
				this.activeElement.tile = tile;
				this.updateElement(this.activeElement);
				// Websocket.send({cmd: 'update', elem: this.activeElement});
				this.activeElement = null;
				this.tilesActive = false;
			}
			else if (this.draw.text) {
				if (!this.drawTextValue) {
					this.menuError = 'Text required before placing.';
					return;
				}
				this.addElement(this.texts, {t:'text', x: tile.x + 0.5, y: tile.y + 0.5, text: this.drawTextValue});
			}

		},
		textClick(index) {
			if (this.role !== 'gm') return;
			const text = this.texts[index];
			if (!text) {
				console.warn('text not found', index);
				return;
			}
			this.tilesActive = false;
			this.pointsActive = false;
			this.activePoint = null;
			if (this.activeElement != text) {
				this.activeElement = text;
				this.textEdit = text.text;
			}
			else
				this.activeElement = null;
		},
		lineClick(index) {
			if (this.role !== 'gm') return;
			const line = this.lines[index];
			if (!line) {
				console.warn('line not found', index);
				return;
			}
			this.activePoint = null;
			if (this.activeElement != line)
				this.activeElement = line;
			else
				this.activeElement = null;
		},
		rectClick(index) {
			if (this.role !== 'gm') return;
			const rect = this.rects[index];
			if (!rect) {
				console.warn('rect not found', index);
				return;
			}
			this.activePoint = null;
			if (this.activeElement != rect)
				this.activeElement = rect;
			else
				this.activeElement = null;
		},
		circleClick(index) {
			if (this.role !== 'gm') return;
			const circle = this.circles[index];
			if (!circle) {
				console.warn('circle not found', index);
				return;
			}
			this.activePoint = null;
			if (this.activeElement != circle)
				this.activeElement = circle;
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
				this.characterDamageEdit = char.dam || 0;
			}
		},
		maskClick(index) {
			if (this.role !== 'gm') return;
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
				if (key !== type) {
					this.draw[key] = false;
					// this.$set(this.draw, key, false);
				}
			}
			this.maskStartPoint = null;
			this.tilesActive = false;
			this.pointsActive = false;
			this.activePoint = null;
			this.resetSketches();
			if (this.draw[type]) {
				this.drawType = type;
				switch (type) {
					case 'lines':
					case 'rects':
					case 'circles':
					case 'masks':
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
		characterNameKeyUp() {
			if (this.drawCharacterName) {
				const names = this.drawCharacterName.split(' ');
				if (names.length > 1)
					this.drawCharacterInitials = (names[0].substr(0,1) + names[1].substr(0,1)).toUpperCase();
				else
					this.drawCharacterInitials = names[0].substr(0,2).toUpperCase();
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
		getLinePoints(line) {
			const points = [];
			if (line.x1) {
				points.push(`${this.getVal(line.x1)},${this.getVal(line.y1)}`);
				points.push(`${this.getVal(line.x2)},${this.getVal(line.y2)}`);
			} else if (line.p) {
				line.p.forEach(p => {
					points.push(`${this.getVal(p.x)},${this.getVal(p.y)}`);
				});
			}
			return points.join(' ');
		},
		getPoint(x, y) {
			return this.points.find(p => p.x == x && p.y == y) || null;
		},
		initGrid(width, height) {
			this.width = width;
			this.height = height;
			this.canvas = document.getElementById('canvas');
			const canvasH = canvas.offsetHeight;
			const canvasW = canvas.offsetWidth;
			const tileSizeH = Math.floor((canvasH - this.marginCanvas * 2) / (this.height + 2 * this.paddingOuterFactor));
			const tileSizeW = Math.floor((canvasW - this.marginCanvas * 2) / (this.width + 2 * this.paddingOuterFactor));
			// console.log('zzzzzz',this.height, this.width, canvasW, canvasH, tileSizeW, tileSizeH);
			this.gridSize = Math.min(tileSizeH, tileSizeW);
			this.textFontSize = this.gridSize;
			this.characterFontSize = Math.floor(this.gridSize / 2);
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
			// this.$set(this, 'grid', grid);
			this.grid = grid;
		},
		createGridPoints() {
			const pointRadius = 5;
			let pointsPerTile = 4;
			const tiles = this.width * this.height;
			if (tiles > 1600) pointsPerTile = 1;
			else if (tiles > 800) pointsPerTile = 2;
			const points = [];
			for (let h=0; h<=this.height; h+=1/pointsPerTile) {
				for (let w=0; w<=this.width; w+=1/pointsPerTile) {
					points.push({t: 'point', x: w, y: h, r: pointRadius})
				}
			}
			// this.$set(this, 'points', points);
			this.points = points;
		},
		createGridTiles() {
			const tiles = [];
			for (let h=0; h<this.height; h++) {
				for (let w=0; w<this.width; w++) {
					tiles.push({t: 'tile', x: w, y: h})
				}
			}
			// this.$set(this, 'tiles', tiles);
			this.tiles = tiles;
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
			switch (action.action) {
				case 'add':
					// @todo missing id on the history elements
					if (action.elem.t == 'line' && action.elem.p.length > 2) {
						action.elem.p.pop();
						const lastPoint = action.elem.p[action.elem.p.length - 1];
						this.activePoint = this.getPoint(lastPoint.x, lastPoint.y);
						this.updateElement(action.elem);
						this.history.push(action); // re-add
					} else {
						this.activePoint = null;
						this.removeElement(list, action.elem, false);
					}
					break;
				case 'delete':
					this.activeElement = null;
					this.activePoint = null;
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
				case 'rect': return this.rects;
				case 'mask': return this.masks;
			}
			return null;
		},
		addElement(list, elem, history=true) {
			list.push(elem);
			if (history) this.historyAdd(elem);
			Websocket.send({cmd: 'add', elem: elem});
		},
		updateElement(elem) {
			Websocket.send({cmd: 'update', elem: elem});
		},
		removeElement(list, elem, history=true) {
			list.splice(0, list.length, ...list.filter(e => e != elem));
			if (history) this.historyDelete(elem);
			Websocket.send({cmd: 'remove', elem: elem});
		},
		clearElements() {
			// @todo history
			this.lines.splice(0, this.lines.length);
			this.rects.splice(0, this.rects.length);
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
			if (!elements) return;
			let elem;
			const lines = [];
			const characters = [];
			const texts = [];
			const rects = [];
			const circles = [];
			const masks = [];
			for (elem of elements) {
				switch (elem.t) {
					case 'line': lines.push(elem); break;
					case 'character': characters.push(elem); break;
					case 'text': texts.push(elem); break;
					case 'rect': rects.push(elem); break;
					case 'circle': circles.push(elem); break;
					case 'mask': masks.push(elem); break;
				}
			}
			// performance: check diff? should it be a hash check instead?
			if (!this.arrayEqual(this.lines, lines))
				this.lines.splice(0, this.lines.length, ...lines);
			if (this.characters != characters)
				this.characters.splice(0, this.characters.length, ...characters);
			if (this.texts != texts)
				this.texts.splice(0, this.texts.length, ...texts);
			if (this.rects != rects)
				this.rects.splice(0, this.rects.length, ...rects);
			if (this.circles != circles)
				this.circles.splice(0, this.circles.length, ...circles);
			if (this.masks != masks)
				this.masks.splice(0, this.masks.length, ...masks);
		},
		onOpen() {
			Websocket.send({cmd:'join', gameId: this.gameId});
		},
		onClose() {
			this.connected = false;
			this.toastError = 'Disconnected!';
		},
		onMessage(msg) {
			// console.log('message', msg);
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
			this.addElement(this.texts, {x: 5, y: 5, text: 'Fissi', t: 'text'});
		},
		connect() {
			Websocket.connect({
				debug: false,
				autoReconnect: true,
				onopen: () => {this.onOpen();},
				onclose: () => {this.onClose();},
				onmessage: (message) => {this.onMessage(message);},
			});
		},
		resetSketches() {
			const zero = {x: 0, y: 0};
			this.sketchText = this.getText(zero, '');
			this.sketchLine = this.getLine(zero, zero);
			this.sketchRect =  this.getRect(zero, zero);
			this.sketchCircle = this.getCircle(zero, zero);
		},
		getRect(point1, point2, name) {
			return {
				t: name,
				x: Math.min(point2.x, point1.x),
				y: Math.min(point2.y, point1.y),
				w: Math.abs(point2.x - point1.x),
				h: Math.abs(point2.y - point1.y),
			};
		},
		getCircle(point1, point2, name) {
			return {
				t: name,
				x: Math.min(point1.x, point2.x),
				y: Math.min(point1.y, point2.y),
				r: Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)),
			};
		},
		getLine(point1, point2, name) {
			return {
				t: name,
				p: [{x: point1.x, y: point1.y}, {x: point2.x, y: point2.y}],
				// x1: point1.x,
				// y1: point1.y,
				// x2: point2.x,
				// y2: point2.y,
			};
		},
		getText(point, text, name) {
			return {t:name,
				x: point.x,
				y: point.y,
				text: text,
			};
		},
		arrayEqual(arr1, arr2) {
			// this is not a perfect way of doing it, but it will suffice
			return JSON.stringify(arr1) === JSON.stringify(arr2);
		},
		optionsBtnMoveClick() {
			this.pointsActive = true;
			this.moveElement = this.activeElement;
		},
		endMove() {
			const elem = this.moveElement;
			this.pointsActive = false;
			this.moveElement = null;
			this.activeElement = null;
			this.updateElement(elem);
		},
		shiftElement(elem, point) {
			switch(elem.t) {
				case 'line':
					let dx, dy;
					if (elem.p) { // points
						let topP;
						elem.p.forEach(p => {
							if (!topP || p.y < topP.y) {
								topP = p;
							}
						});
						dx = point.x - topP.x;
						dy = point.y - topP.y;
						elem.p.forEach(p => {
							p.x += dx;
							p.y += dy;
						});
					} else {
						dx = point.x - elem.x1;
						dy = point.y - elem.y1;
						elem.x1 = point.x;
						elem.y1 = point.y;
						elem.x2 += dx;
						elem.y2 += dy;
					}
					break;
				case 'circle':
				case 'rect':
				case 'text':
				case 'mask':
					// const dx = point.x - elem.x;
					// const dy = point.y - elem.y;
					elem.x = point.x;
					elem.y = point.y;
					break;
			}
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
							case 'rect':
								this.removeElement(this.rects, this.activeElement);
								break;
							case 'circle':
								this.removeElement(this.circles, this.activeElement);
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
					if (this.moveElement) {
						this.endMove();
						return;
					}
					if (this.activePoint) {
						this.activePoint = null;
						this.activePolyLine = null;
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
		activeElement(val) {
			if (val) {
				const el = document.body.querySelector(`[data-object-id="${val.id}"]`);
				if (el) {
					const rect = el.getBoundingClientRect();
					this.objectOptions.top = rect.top - 45;
					this.objectOptions.left = rect.left;
				}

			}
		},
		textEdit(val) {
			if (this.activeElement && this.activeElement.t == 'text') {
				this.activeElement.text = val;
			}
		},
		characterDamageEdit(val) {
			if (this.activeElement && this.activeElement.t == 'character') {
				this.activeElement.dam = val;
			}
		},
	},
});
vueApp.mount('#app');