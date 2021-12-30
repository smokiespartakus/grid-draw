const config = require('../../config');
const logger = require('../utils/logger').init(config, require('path').basename(__filename));
const Random = require('../utils/random');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const uuidV4 = require('uuid').v4;
// const performance = require('perf_hooks').performance;
// const workerCount = require('os').cpus().length;
const rootDir = path.dirname(path.join(__dirname, '..'));
const publicDir = path.join(rootDir, 'public');
const viewDir = path.join(rootDir, 'views');

class HttpController {
	statusData = {};
	/**
	 * @var {GameController} gameController
	 */
	gameController;
	constructor(onHttpMessage, gameController) {
		this.gameController = gameController;
		this.onHttpMessage = onHttpMessage;
	}

	register(app) {
		//app.set('views', __dirname + '/views');
		app.use(bodyParser.json());       // to support JSON-encoded bodies
		app.use(bodyParser.urlencoded({// to support URL-encoded bodies
			extended: true
		}));
		app.engine('ejs', require('express-ejs-extend'));
		app.set('view engine', 'ejs');
		app.set('views', viewDir);
		//console.log(">>>>>>", express.staticProvider);

		//app.get('/server', postAction);
		app.get('/action/:action', (req, res) => { this._postAction(req, res); });
		app.post('/action/:action', (req, res) => { this._postAction(req, res); });
		// Tmp get posting

		/*
		 * Test page
		 * need to put this behind credentials at some point
		 */
		app.get('/', (req, res) => {
			//	console.log(signals.check('reboot'));
			res.render('pages/index');
			// res.sendFile(path.join(rootDir, 'public', 'index.html'));
		});
		/*
		 * Render Status page
		 * need to put this behind credentials at some point
		 */
		app.get('/status', (req, res) => {
//		console.log('get status', process.pid);
			const uuid = uuidV4();
			let interval, timeout;
			interval = setInterval(() => {
				if (!this.isStatusDataSet(uuid)) return;
				// const statusData = this.statusData;
				clearInterval(interval);
				clearTimeout(timeout);
				this.renderStatus(req, res, this.statusData[uuid]);
				delete this.statusData[uuid];
				// logger.yellow('len', Object.values(this.statusData).length);
			}, 100);

			this.onHttpMessage('get-status', {uuid: uuid});

			timeout = setTimeout(() => {
				clearInterval(interval);
				clearTimeout(timeout);
				this.renderStatus(req, res, {error: 'status-get timed out.'});
				delete this.statusData[uuid];
			}, 5000);
		});

		app.post('/', (req, res) => {
			res.json({Hello: 'World!'});
		});

		app.get('/game/:id?', (req, res) => {
			const gameId = req.params.id;
			if (!gameId) {
				res.render('errors/404');
				return;
			}

			res.render('pages/game', {
				gameId: gameId,
				data: {},
			});
		});
		/*
		 * Get all the other files and pages (mostly for js/css/pics)
		 */
		app.get('/*', (req, res) => {
			let file = path.join(rootDir, 'public', req.url);
			let stats;
			try {
				stats = fs.lstatSync(file);
			} catch (e) {
			}
			if (stats && stats.isFile()) {
				res.sendFile(file);
				return;
			}
			let stats2, view;
			try {
				view = 'pages/' + req.url.split('/')[1];
//			console.log(view);
				file = path.join(viewDir, view + '.ejs');
				stats2 = fs.lstatSync(file);
			} catch (e) {
			}
			if (view && stats2 && stats2.isFile()) {
				res.render(view);
				return;
			}
			res.render('errors/404');
			// res.sendFile(path.join(rootDir, 'public', '404.html'));
		});

		/**
		 * POST request from server. To Start/Pause/Resume
		 * @param {http repuest} req
		 * @param {http response} res
		 * @returns {undefined}
		 */
	}

	renderStatus(req, res, statusData) {
		const file = 'pages/status';
		let serverStarted = new Date(statusData.serverStarted);
		let now = new Date(statusData.now);
		// if (logger.isDebugEnabled) logger.log(matchesByApp);
		const sinceRestart = Math.floor(((new Date()).getTime() - serverStarted.getTime()) / 1000 / 3);
		const r = Math.min(128, sinceRestart);
		const gb = Math.max(128, 255-sinceRestart);
		const renderData = {
			...statusData, ...{
				// reboot: signals.check('reboot'),
				serverStarted: serverStarted + "",
				now: now,
				timeColor: 'rgb(' + r + ',' + gb + ',' + gb + ')',
				appName: config.appName,
				bodyBG: config.statusPage ? config.statusPage.bodyBG : null,
			},
		};
		// logger.yellow('fissi', renderData);
		res.render(file, renderData);

	}

	setStatusData(data, uuid) {
		this.statusData[uuid] = data;
	}

	isStatusDataSet(uuid) {
		return this.statusData[uuid];
//		if (config.mode == 'redis') {
		// wait for all cores to return data
//			return statusData.workersReturned == workerCount;
//		}
// 		return true;
	}

	_postAction(req, res) {
		if (logger.isDebugEnabled) logger.log('postaction body', req.body, req.params);
		// must post a valid secret key
		const action = req.params.action;
		switch (action) {
			case 'create':
				const game = this.gameController.createGame(parseInt(req.body.w), parseInt(req.body.h));
				res.send(JSON.stringify({gameId: game.id}));
				break;
			case 'get':
				res.send(JSON.stringify({gameId: gameId}));
				break;
			default:
				res.send(JSON.stringify({error: '404 Not found'}), 404);
				break;
		}
	}
}

module.exports = HttpController;
