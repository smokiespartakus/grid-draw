
const logger = require('./utils/logger').init(require('path').basename(__filename));

class User {
	uuid;
	name = '';
	gameId;
	constructor(uuid) {
		this.uuid = uuid;
	}

	setName(name) {
		this.name = name;
	}
	toObject() {
		return {
			name: this.name,
		};
	}
}

module.exports = User;
