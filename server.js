// use `nodemon server` to auto reload on save
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const logger = require('./src/utils/logger').init(path.basename(__filename));
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
// if (process.env.WORKER_MODE == 'redis')
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
if (process.env.APP_ENV == 'local') {
	readline.question(`What do you want?\n`, onReadline);
}
