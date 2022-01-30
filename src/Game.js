const fs = require('fs').promises;
const path = require('path');
const logger = require('./utils/logger').init(path.basename(__filename));
const Arr = require('./utils/Arr');
const { GameError } = require('./errors');
const paths = require('./helpers/paths');

class Game {
	id;
	users = [];
	elements = [];
	fps = 10;
	_elemId = 1;
	width = 1;
	height = 1;
	lastSend = 0;
	lastUpdate = 0;
	lastBackup = 0;
	created = 0;
	constructor(id, width, height) {
		this.width = width;
		this.height = height;
		this.id = id;
		this.created = (new Date()).getTime();
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
		if (process.env.BACKUP_ENABLED) {
			this.backupInterval = setInterval(() => {
				this.backup();
			}, 10000);
		}
	}

	static async fromBackup(id) {
		const file = path.join(paths.storage, 'backups', `backup-${id}.json`);
		let json;
		try {
			json = await fs.readFile(file, "binary");
		} catch(e) {
			return null;
		}
		// console.log('data', json);
		if (json) {
			const data = JSON.parse(json);
			if (logger.isDebugEnabled) logger.debug('Loading From backup ' + path.basename(file));
			const game = new Game(id, data.width, data.height);
			game.lastBackup = data.lastBackup || 0;
			game.lastSend = data.lastBackup || 0;
			game.lastUpdate = data.lastUpdate || 0;
			game.created = data.created;
			game.elements = data.elements;
			game._elemId = data.elemId;
			return game;
		} else {
			// throw new GameError('Backup does not exist for ' + id);
			return null;
		}
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

	backup() {
		if (this.lastBackup >= this.lastUpdate) return;
		this.lastBackup = (new Date()).getTime();
		try {
			const str = JSON.stringify(this.toObjectWithElements());
			const file = path.join(paths.storage, 'backups', `backup-${this.id}.json`);
			fs.readFile(file).then((data) => {
				if (data != str) {// avoid nodemon restarting infinitely
					if (logger.isDebugEnabled) logger.debug('Updating ' + path.basename(file));
					fs.writeFile(file, str).catch((e) => {
					});
				}
			}).catch((e) => {
				fs.writeFile(file, str).catch((e) => {
				});
			});
		} catch(e) {
			logger.purple('backup err', e);
		}
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
	toObjectWithUsers() {
		const data = this.toObject();
		data.created = (new Date(this.created)).toString().split(' GMT')[0];
		data.lastUpdate = (new Date(this.lastUpdate)).toString().split(' GMT')[0];
		data.users = this.users.map(u => u.toObject());
		return data;
	}

	toObjectWithElements() {
		const data = this.toObject();
		data.elements = this.elements;
		data.created = this.created;
		data.elemId = this._elemId;
		data.lastSend = this.lastSend;
		data.lastUpdate = this.lastUpdate;
		return data;
	}
}
module.exports = Game;
