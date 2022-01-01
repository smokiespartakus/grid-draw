
const logger = require('../utils/logger').init(require('path').basename(__filename));

const { GameError, ExtendedError } = require('../errors');
const GameController = require('../GameController');

class WsCommand {
	id = null;
	cmd = null;
	/**
	 * @type {User}
	 */
	user = null;
	/**
	 * @type {GameController}
	 */
	ctrl = null;
	/**
	 * @type {Game}
	 */
	game = null;
	/**
	 * @type {{}}
	 */
	data = null;
	error = null;
	/**
	 * @type {{}}
	 */
	result = null;
	constructor(id, user, cmd, data) {
		this.id = id;
		this.user = user;
		this.cmd = cmd;
		this.data = data;
	}
	async run() {
		return new Promise((resolve, reject) => {
			const data = this.data;
			const player = this.player;
			let autoResolve = true;
			let game;
			try {
				switch (this.cmd) {
					// case 'send':
					// 	this.sendWS(data.uuid, data.data);
					// 	break;
					case 'create':
						break;
					case 'leave':
						this.ctrl.leave(this.user);
						break;
					case 'join':
						// @tmp need to be able to restart server while testing
						if (process.env.APP_ENV == 'local' && data.gameId && !this.ctrl.find(data.gameId)) {
							const g = this.ctrl.createGame(16,12);
							g.id = data.gameId;
						}
						// game = this.ctrl.find(data.gameId);
						game = this.ctrl.join(this.user, data.gameId);
						if (game) {
							this.result = {action: 'join', game: game.toObject()};
						}
						break;
					case 'set-name':
						this.user.name = data.name;
						this.result = {action: 'set-name', name: data.name};
						if (this.user.gameId) {
							game = this.ctrl.find(this.user.gameId);
							if (game) game.touchUpdate();
						}
						break;
					case 'add':
						game = this.ctrl.find(this.user.gameId);
						if (game) {
							const elem = game.addElement(data.elem);
							this.result = {action: 'element-id', id: elem.id};
						}
						break;
					case 'remove':
						game = this.ctrl.find(this.user.gameId);
						if (game) {
							game.removeElement(data.elem);
							// this.result = {success: this.cmd};
						}
						break;
					case 'update':
						game = this.ctrl.find(this.user.gameId);
						if (game) {
							game.updateElement(data.elem);
							// this.result = {success: this.cmd};
						}
						break;
					default:
						this.setError('command not found');
				}
			} catch (e) {
				this.onCommandErrorCatch(e);
			}
			if (autoResolve) {
				resolve();
			}
		});
	}

	onCommandErrorCatch(e) {
		this.setError(e.message, e.data);
		if (e.name === 'ExtendedError') {
		} else if (e.name === 'GameError') {
			// this should't be logged to file
			// logger.warning('WS Command Error', e.message, e.data);
		} else {
			// don't use throw error. Use throw GameError or ExtendedError
			logger.error('WS Command Error', e);
		}
	}

	setError(err, errData) {
		this.error = err;
		this.errorData = errData;
	}

	toObject() {
		if (this.error) {
			let errData = null;
			if (this.errorData) {
				try {
					// need to test that it's stringifyable
					 JSON.stringify(this.errorData);
					 errData = this.errorData;
				} catch(e) {
					 errData = this.errorData.toString();
				}
			}
			return {
				cmdId: this.id,
				fail: this.cmd,
				err: this.error,
				errData: errData,
			};
		}
		if (!this.id && !this.result) return null;
		return {
			cmdId: this.id,
			...(this.result || {}),
		};
	}
}

module.exports = WsCommand;
