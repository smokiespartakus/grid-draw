// use `nodemon server` to auto reload on save
require('dotenv').config();
const config = require('./config');
const path = require('path');
const logger = require('./src/utils/logger').init(config, path.basename(__filename));
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
// if (config.mode == 'redis')
// 	require('./src/_old/server_redis.js');
// else
require('./src/server/server_single_worker.js');

const onReadline = (name) => {
	logger.yellow(`Action: ${name}!`)
	switch (name) {
		default:
			console.log(logger.getColorStart('yellow') + '\nPossible actions: '
				// + logger.getColorStart('cyan') +  '\n- update units'
				// + logger.getColorStart('cyan') +  '\n- update groups'
				+ logger.getColorEnd() + '\n');
	}
	readline.question(`What do you want?\n`, onReadline);
};
if (config.environment == 'local') {
	readline.question(`What do you want?\n`, onReadline);
}
