const config = require('../config');
const logger = require('./utils/logger').init(config, require('path').basename(__filename));
const Arr = require('./utils/Arr');

class Game {

	users = [];
	constructor(id) {
		this.id = id;
	}
	/**
	 * @param {Function} sendDataFn
	 */
	setSendDataFn(sendDataFn) {
		this.sendDataFn = sendDataFn;
	}

	join(user) {
		if (!this.users.find(u => u.uuid == user.uuid)) {
			this.users.push(user);
		}
	}

	leave(user) {
		Arr.loopRemove(this.users, (u) => {
			return user.uuid == u.id;
		});
	}

}
module.exports = Game;
