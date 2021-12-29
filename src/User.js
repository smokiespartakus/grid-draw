const config = require('../config');
const logger = require('./utils/logger').init(config, require('path').basename(__filename));

class User {
	uuid;
	name = '';
	constructor(uuid) {
		this.uuid = uuid;
	}

	setName(name) {
		this.name = name;
	}
}

module.exports = User;
