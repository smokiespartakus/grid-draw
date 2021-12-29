/**
 * Game Specific Error containing extra data object.
 * Will not be logged to file when occurring on wsCommand
 */
class GameError extends Error {
	/**
	 * @param {{}|*[]} data
	 */
	data;

	static create(message, ...args) {
		const error = new GameError(message, ...args);
		return error;
	}

	constructor(message, ...args) {
		super(message);
		this.name = 'GameError';
		this.data = args || [];
	}
}

module.exports = GameError;
