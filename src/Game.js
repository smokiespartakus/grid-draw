const config = require('../config');
const logger = require('./utils/logger').init(config, require('path').basename(__filename));
const Arr = require('./utils/Arr');

class Game {
	id;
	users = [];
	elements = [];
	lastSend = 0;
	lastUpdate = 0;
	fps = 10;
	_elemId = 1;
	width;
	height;
	constructor(id, width, height) {
		this.width = width;
		this.height = height;
		this.id = id;
		this.interval = setInterval(() => {
			// logger.cyan('interval', this.lastUpdate, this.lastSend);
			if (this.isDirty()) {
				const data = {
					action: 'update',
					elements: this.getElements(),
					users: this.users.map(u => u.toObject()),
				};
				this.emit(data);
			}
		}, 1000 / this.fps);
	}
	/**
	 * @param {Function} sendDataFn
	 */
	setSendDataFn(sendDataFn) {
		this.sendDataFn = sendDataFn;
	}

	emit(data) {
		const str = JSON.stringify(data);
		// logger.purple('>>> EMIT', this.users.length, str);
		this.users.forEach(u => this.sendDataFn(u.uuid, str));
		this.touchSend();
	}

	join(user) {
		if (!this.users.find(u => u.uuid == user.uuid)) {
			this.users.push(user);
			user.gameId = this.id;
		}
	}

	leave(user) {
		Arr.loopRemove(this.users, (u) => {
			return user.uuid == u.uuid;
		});
	}

	addElement(elem) {
		elem.id = this.nextId();
		this.elements.push(elem);
		this.touchUpdate();
		return elem;
	}

	removeElement(elem) {
		Arr.loopRemove(this.elements, (e) => {
			return e.id == elem.id;
		});
		this.touchUpdate();
	}

	updateElement(elem) {
		const ee = this.elements.find(e => e.id == elem.id);
		if (ee) {
			let k;
			// @todo remove keys from old?
			for (k of Object.keys(elem)) {
				ee[k] = elem[k];
			}
		}
		this.touchUpdate();
	}

	getElements() {
		return [...this.elements];
	}

	isDirty() {
		return this.lastUpdate > this.lastSend;
	}
	touchUpdate() {
		this.lastUpdate = (new Date()).getTime();
	}
	touchSend() {
		this.lastSend = (new Date()).getTime();
	}
	nextId() {
		return this._elemId++;
	}
	toObject() {
		return {
			id: this.id,
			width: this.width,
			height: this.height,
		};
	}
}
module.exports = Game;
