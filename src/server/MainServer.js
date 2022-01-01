
// web app
const express = require('express');

// web servers
const http = require('http');
const https = require('https');
const websocket = require('websocket').server;

// Filesystem
const fs = require('fs');

// const signals = require('../utils/signals')(__dirname);

// Match
const GameController = require('../GameController'); //(postApi, debug);
// const matchLogs = require('./utils/match_logs.js')(__dirname);
const ConnectionList = require('../utils/connection_list');
const WsController = require('./WsController');
const HttpController = require('./HttpController');

const logger = require('../utils/logger').init(require('path').basename(__filename));
// require('../data/onstart');


/**
 *
 * @param workerId
 * @param onHttpMessage
 * @param onWSMessage
 * @constructor
 */
class Server {
	constructor(workerId, onHttpMessage, onWSMessage, onGameSendData, serverStarted) {
		this._serverStarted = serverStarted;
		this.sendDataFn = onGameSendData;
		this.workerId = workerId;
		this.connections = new ConnectionList();
		const wsController = new WsController(this.connections, onWSMessage, this.findGameController());
		this.httpController = new HttpController(onHttpMessage, this.findGameController());
		this.httpController.isServerReady = (status) => { return this.isServerReady(status); };
		this.httpController.getServerStatus = () => { return this.getServerStatus(); };
		// const registerApp = RegisterApp(this.isServerReady, this.getServerStatus, onHttpMessage);
		// const registerWS = RegisterWS(this.isServerReady, this.getServerStatus, this.connections, onWSMessage);
// Create Express web app
		const app = express({});
		app.use(express.static('public'));
		this.httpController.register(app);
		// this.httpApp = registerApp(app);
// Create server from express app
		const server = http.Server(app);
// start server
		this.serverListen(server, process.env.LISTEN_PORT, process.env.LISTEN_DOMAIN || null);
// create websocket server
		const wsServer = new websocket({
			httpServer: server,
		});
		wsController.register(wsServer, this.workerId);
		// registerWS(wsServer, this.workerId);

	}

	/**
	 * Send message to websocket connection.
	 * @param {string} uuid
	 * @param {{}|string} data
	 */
	sendWS(uuid, data) {
		// logger.debug('sendWS', uuid, data);
		let connection;
		if (uuid && this.connections.has(uuid)) {
			//if (logger.isDebugEnabled) logger.debug('serverMain.sendWS send to connection', this.workerId, uuid, data);
			connection = this.connections.get(uuid)
		}
		if (!connection || !connection.connected || connection.state != 'open') {
			return;
		}
		try {
			let dataSend = data;
			if (typeof dataSend == "object") dataSend = JSON.stringify(data);
			if (data !== null) {
				connection.sendUTF(dataSend);
			} else {
				const stack = new Error().stack;
				logger.warn('sendWS trying to send null', data, stack);
			}
		} catch (e) {
			logger.error('sendWS error', data, e);
		}
	}

	/**
	 *
	 * @param {WsCommand} command
	 */
	async runWsCommand(command) {
		// logger.purple('run command', command.cmd);
		return new Promise((resolve, reject) =>
		{
			try {
				let result;
				const user = command.user;
				const data = command.data;
				const gameId = user.gameId || command.data.gameId;
				const ctrl = this.findGameController();
				let game, player;
				if (ctrl && gameId) {
					game = ctrl.find(gameId);
				}
				// logger.purple('game', user.id, gameId, game);
				if (game && user.id) {
					player = game.findPlayer(user.id);
				}
				command.ctrl = ctrl;
				command.game = game;
				command.player = player;
				command.run().finally(() => {
					resolve();
				});
			} catch(e) {
				command.setError('run command error');
				logger.error('Run queue command error: ', command.cmd, e);
				resolve();
			}
		});
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {{}} data
	 */
	runHttpCommand(cmd, data) {
		let ctrl, game, players, player, user, u;
		switch (cmd) {
			case 'get-status':
				let status = this.getStatusData();
				this.sendStatusData(status, data.uuid);
				break;
			case 'create-match':
				ctrl = this.findGameController();
				players = [];
				// logger.purple('create-match', data, typeof data.users);
				if (data.users) {
					if (typeof data.users == 'string') data.users = JSON.parse(data.users);
					for (u of data.users) {
						// .. create some players from users.. we should have each user's id + token to get some data if needed....
						user = new User();
						user.id = u.id;
						user.captainType = u.captainType;
						user.name = u.name;
						player = new Player(user);
						players.push(player);
					}
				}
				game = ctrl.createGame(players, data.mode, data.version);
				if (game) {
					if (data.settings) game.tools.settings.setSettings(data.settings);
					return {matchId: game.id};
				}
				return {error: 'game not created'};
			case 'create-bot-matches':
				ctrl = this.findGameController();
				logger.purple('create-bot-matches', data);
				const amount = data.amount || 1;
				const ids = [];
				for (let i=0; i<amount; i++) {
					game = ctrl.createGame([], GameMode.Bots, data.version || '1.0');
					if (game) {
					 	ids.push(game.id);
						if (data.settings) {
							try {
								if (typeof data.settings == 'string') data.settings = JSON.parse(data.settings);
								game.tools.settings.setSettings(data.settings);
							} catch(e) {
								logger.error('create bot matches: settings parse fail', e);
							}
						}
					}
				}
				return {amount: amount, matches: ids};
			default:
				console.log('command not found', data.cmd);
				break;
		}
	}

	disconnect(user) {
		this.findGameController().leave(user);
	}

	sendStatusData(data, uuid) {
		this.httpController.setStatusData(data, uuid);
	}

	getStatusData() {
		let games = [];
		let ctrl = this.gameController;
		if (ctrl) {
			games.push(...ctrl.getGames().map(g => g.toObjectStatus()));
		}
		games.sort(function(a,b) {
			let aEnd = a.isEnded ? a.timeEnded.getTime() : 0;
			let bEnd = b.isEnded ? b.timeEnded.getTime() : 0;
			if (aEnd > bEnd) return -1; // can never remember which
			if (bEnd > aEnd) return 1;
			return a.round - b.round;
		});
		return {
			games: games,
			live: games.filter(g => !g.isEnded).length,
			count: games.length,
			serverStarted: this._serverStarted,
			now: new Date(),
			worker: this.workerId,
		};
	}

	/**
	 *
	 * @returns {GameController}
	 */
	findGameController() {
		if (!this.gameController) {
			this.gameController =  new GameController(this.sendDataFn);
		}
		return this.gameController;
	}

	serverListen(server, port, domain) {
		if (domain) {
			server.listen(port, domain, () => {
				if (logger.isDebugEnabled) logger.info("http(s) server started", this.workerId, domain, port);
			});
		} else {
			server.listen(port, () => {
				if (logger.isDebugEnabled) logger.info("http(s) server started", this.workerId, domain, port);
			});
		}
	}

	isServerReady(status) {
		status = status || this.getServerStatus();
		return status == 'live';
	}

	getServerStatus() {
		if (signals.check('reboot')) return 'reboot';
		return 'live';
	}
}

module.exports = Server;