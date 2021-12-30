/*
$ npm install nodemon -g
$ nodemon server
 */

// Configuration


require("dotenv").config();
const config = require('../../config');
const logger = require('../utils/logger').init(config, require('path').basename(__filename));

logger.always("Starting server...", getTimeString());

/**
 * @param {Date} used for status page
 */
const _serverStarted = new Date();
// @TODO CAN This whole else be moved into a separate file which can be reused on all modes?
//
const ServerMain = require('./MainServer');
const WsCommandQueue = require('./WsCommandQueue');
const myServer = new ServerMain(1, onHttpMessage, onWSMessage, onGameSendData, _serverStarted);

// Need to make an object of this
const wsQueue = new WsCommandQueue();

// Restore unfinished games from match logs
// if (cluster.worker.id == 1) { // only on one worker. Seems like ids are incrementing from 1 as they are created.
// 	var restoredMatches = matchLogs.restoreAll();
// }

/**
 * Message sent to HTTP server. Pass through here.
 * @note For redis servers, which we gave up on I believe..
 * @param {string} cmd
 * @param {{}} data
 */
function onHttpMessage(cmd, data) {
	// this is a bit back and forth, but it has to do with potential use of redis server
	// also not possible to return anything if using cluster
	return myServer.runHttpCommand(cmd, data);
}


/**
 * Message sent via Websocket (from user). Pass through here.
 * @param {{}} data
 * @param {{}} data
 */
function onWSMessage(user, data) {
	const uuid = user.uuid;
	if (logger.isDebugEnabled) logger.log('onWSMessage', data, wsQueue.length(user));
	if (data.cmd === 'disconnect') {
		onWSDisconnect(user);
	} else {
		// if (data.cmd == 'buy-unit') logger.info('but buy unit', data);
		queueWSCommand(user, data);
	}
}

function queueWSCommand(user, data) {
	const appId = user.appId;
	const uuid = user.uuid;
	const command = wsQueue.create(data.cmdId, user, data.cmd, data);
	if (wsQueue.length(user) == 1) {
		runWSQueueCommand(command);
	}
}

/**
 *
 * @param {WsCommand} command
 */
function runWSQueueCommand(command) {
	const user = command.user;
	try {
		myServer.runWsCommand(command)
			.then(() => {

			})
			.catch(() => {

			})
			.finally(() => {
				if (logger.isDebugEnabled) logger.log('runWSQueueCommand', user.uuid, command.toObject());
				
				const data = command.toObject();
				if (data) {
					onGameSendData(user.uuid, data);
				}

				wsQueue.pop(user);
				// run next command

				if (wsQueue.length(user) > 0) {
					const command = wsQueue.get(user);
					runWSQueueCommand(command);
				}
			});
	} catch(e) {
		// not sure this will do anything
		command.setError('run command error');
		logger.error('Run queue command error: ', command.cmd, e);
	}

}

/**
 * Data sent from (via) match controller to a user (connection). Function passed into match controllers.
 * This is sort of "double" because in case of redis it needs to send to the correct server
 * @param {string} uuid
 * @param {{}} data
 */
function onGameSendData(uuid, data) {
	myServer.sendWS(uuid, data);
}


function onWSDisconnect(user) {
	if (logger.isDebugEnabled) logger.yellow('Disconnect', user.uuid);
	// user.disconnect();
	// const appId = user.appId;
	// const uuid = user.uuid;
	wsQueue.clear(user);
	myServer.disconnect(user);
	// myServer.unsubscribeAll(appId, uuid);
}

// Utils
function zeros(x) { return ('0' + x).slice(-2); }
function getTimeString(t) {
	t = t || new Date();
	var ms = t.getMilliseconds();
	ms *= ms < 10 ? 100 : (ms < 100 ? 10 : 1);

	var tt = t.getFullYear() + '-' + zeros(t.getMonth() + 1) + '-' + zeros(t.getDate()) 
			+ ' ' + zeros(t.getHours()) + ':' + zeros(t.getMinutes()) + ':' + zeros(t.getSeconds()) + '.' + ms;
	return tt;
}