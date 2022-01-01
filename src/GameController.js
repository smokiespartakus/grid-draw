
const logger = require('./utils/logger').init(require('path').basename(__filename));
const Game = require('./Game');
const User = require('./User');
const { GameError } = require('./errors');
const Arr = require('./utils/Arr');
const Random = require('./utils/random');


class GameController {
	/**
	 * @type {Game[]}
	 */
	games = [];

	/**
	 * Match Controller
	 * @param {function} sendDataFn function that will send data. Either plain websocket, via a worker, or via redis.
	 */
	constructor(sendDataFn) {
		this.sendDataFn = sendDataFn;
		this.games = [];
	}

	/**
	 * Find game by id.
	 * @param gameId
	 * @returns {Game}
	 */
	find(gameId) {
		return this.games.find(g => g.id == gameId) || null;
	}

	/**
	 *
	 * @param players
	 * @return {Game}
	 */
	createGame(width, height) {
		const game = new Game(this.getNewId(), width, height);
		this.games.push(game);
		game.setSendDataFn(this.sendDataFn);
		return game;
	}

	hasGame(gameId) {
		return !!this.find(gameId);
	}

	getGames() {
		return this.games;
	}
	leave(user) {
		this.games.forEach((game) => {
			game.leave(user);
		});
		user.gameId = null;
	}
	join(user, gameId) {
		const game = this.find(gameId);
		if (!game) {
			throw new GameError('Game not found.');
		}
		game.join(user);
		return game;
	}
	cleanGames() {
		let i, game;
		Arr.loopRemove(this.games, (game) => {
			if (game && (game.isEnded() || game.getTimeSinceCreated() > 3600000)) {
				game.clean();
				if (logger.isDebugEnabled) logger.log("clean match", game.id);
				return true;
			}
			return false;
		});
	}
	/**
	 * Secure way of generating id that does not exist. Or more secure than time to string.
	 * @returns {string}
	 */
	getNewId() {
		let id = this.generateId(6);
		while (this.find(id)) {
			id = this.generateId(6);
		}
		return id;
	}

	/**
	 *
	 * @param length
	 * @return {string}
	 */
	generateId(length) {
		const chars = 'abcdefghijkmnpqrstuwvxyz23456789';
		let id = '';
		for (let i = 0; i < length; i++ ) {
			id += chars.charAt(Random.randomInt0toX(chars.length - 1));
		}
		return id;
		// return "#" + new Date().getTime().toString(36);
	}


}
module.exports = GameController;
