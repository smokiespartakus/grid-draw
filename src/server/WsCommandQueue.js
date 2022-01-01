
const logger = require('../utils/logger').init(require('path').basename(__filename));

const WsCommand = require('./WsCommand');

class UserQueue {
	/**
	 * @type {WsCommand[]}
	 */
	queue = [];
	length = 0;
	_interval;
	constructor(uuid) {
		this.uuid = uuid;
	}

	/**
	 * @param {WsCommand} command
	 */
	push(command) {
		this.queue.push(command);
		this.length = this.queue.length;
	}

	/**
	 * @returns {WsCommand}
	 */
	pop() {
		const command = this.queue.shift();
		this.length = this.queue.length;
		return command;
	}

	/**
	 * @returns {WsCommand}
	 */
	get() {
		if (this.queue.length > 0) return this.queue[0];
		return null;
	}
}

class WsCommandQueue {
	queues = {};

	/**
	 * @param {string} cmdId command id (from app)
	 * @param {User} user
	 * @param {string} cmd command
	 * @param {{}} data command data
	 * @returns {WsCommand}
	 */
	create(cmdId, user, cmd, data) {
		const command = new WsCommand(cmdId, user, cmd, data);
		this.push(command);
		return command;
	}

	/**
	 * @param {WsCommand} command
	 */
	push(command) {
		this._getQueue(command.user).push(command);
	}

	/**
	 * @returns {WsCommand}
	 */
	pop(user) {
		if (!this.hasQueue(user)) return null;
		return this._getQueue(user).pop();
	}

	/**
	 *
	 * @param user
	 * @returns {WsCommand|null}
	 */
	get(user) {
		if (this._getQueue(user).length) {
			return this._getQueue(user).get();
		}
		return null;
	}

	clear(user) {
		delete this.queues[user.uuid];
	}

	length(user) {
		if (!this.hasQueue(user)) return 0;
		return this._getQueue(user).length;
	}

	hasQueue(user) {
		return !!this._getQueue(user, false);
	}

	/**
	 * @param {User} user
	 * @param createNew
	 * @returns {UserQueue}
	 */
	_getQueue(user, createNew = true) {
		if (createNew && !this.queues[user.id]) {
			this.queues[user.id] = new UserQueue(user.id);
		}
		return this.queues[user.id];
	}
}

module.exports = WsCommandQueue;

