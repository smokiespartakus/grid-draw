
const logger = require('../utils/logger').init(require('path').basename(__filename));
const uuidV4 = require('uuid').v4;
const User = require('../User');

class WsController {
	/**
	 * @var {GameController} gameController
	 */
	gameController;
	constructor(connections, onWSMessage, gameController) {
		// this.isServerReady = isServerReady;
		// this.getServerStatus = getServerStatus;
		this.connections = connections;
		this.onWSMessage = onWSMessage;
		this.gameController = gameController;
	}

	register(wsServer, workerId) {
		this.workerId = workerId;
		if (logger.isInfoEnabled) logger.info("Register WebSocket Server. WorkerID=" + workerId);
		// Start websocket server
		wsServer.on('request', (request) => {
			this._onRequest(request);
		});

	}

	_onRequest(request) {
		if (logger.isDebugEnabled) logger.debug("connection request. WorkerID=" + this.workerId);
		// const uri = request.httpRequest.url.replace(/^\//, '').split('/');
		// const gameId = uri[0];
		// if (gameId && this.gameController.hasGame(gameId)) {
			this._acceptRequest(request);
		// } else {
		// 	request.reject('Game Id Not found: ' + gameId);
		// }
	}

	_acceptRequest(request) {
		const connection = request.accept(null, request.origin);
		connection.uuid = uuidV4();
		const user = new User(connection.uuid);
		this.connections.add(connection.uuid, connection);
		// @todo find other connections of this user and close them?
		// On message received from client
		connection.on('message', (message) => {
			this._onMessage(connection, user, message);
		});

		// On Connection close
		connection.on('close', (connectionClose) => {
			this._onClose(connection, user, connectionClose);
		});
	}

	_onMessage(connection, user, message) {
		if (logger.isDebugEnabled) logger.debug("message", message);
		if (message.type === 'utf8') {
			this._handleMessage(connection, message.utf8Data, user);

		} else if (message.type === 'binary') {
			//In NodeJS (Buffer), you can use toString(encoding) to get
			//the string representation of the buffer.
			try {
				this._handleMessage(connection, message.binaryData.toString('utf8'), user);
			} catch(e) {
				if (logger.isDebugEnabled) logger.log(e.message, e, message);
			}
		}
	}

	_onClose(connection, user, connectionClose) {
		this.connections.remove(connection.uuid);
		if (logger.isDebugEnabled) logger.log("close", connection.uuid);
		try {
			this.onWSMessage(user, {cmd:'disconnect'});
		} catch (e) {
			if (logger.isDebugEnabled) logger.error("on Disconnect error ", connection.uuid, e);
		}
		// process.send({cmd: 'unregister-uuid', uuid: connection.uuid});
	}

	/**
	 * Handle Client Message (only used for subscribe and unsubscribe)
	 * @param {type} connection
	 * @param {string} message
	 * @param {User} user
	 * @returns {undefined}
	 */
	_handleMessage(connection, message, user) {
		try {
			const data = JSON.parse(message);
			// @TMP For testing - make a local check or something
			if (data.userId && !user.id) {
				user.id = data.userId;
			}
			if (logger.isDebugEnabled) logger.debug("Handle Message", data.cmd, data);
			this.onWSMessage(user, data);
		} catch (e) {
			logger.error('HandleMessage error: ', e.message, e);
		}
	}
}

module.exports = WsController;
