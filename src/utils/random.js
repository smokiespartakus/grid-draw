function randomIntXtoY(x, y) {
	return Math.floor(Math.random() * (y+1-x)) + x;
}

function randomFloatXtoY (x, y) {
	return Math.random() * (y-x) + x;
}

const random = {

	/**
	 * Shuffle array elements
	 * @param array
	 */
	shuffle(array) {
		let i, j;
		for (i = array.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	},

	/**
	 * Get random int between 1 and x, both included.
	 * @param {int} x
	 */
	randomInt1toX(x) {
		return randomIntXtoY(1, x);
	},

	/**
	 * Get random int between 0 and x, both included.
	 * @param {int} x
	 * @returns {number}
	 */
	randomInt0toX(x) {
		return randomIntXtoY(0, x);
	},

	/**
	 * Get random int between x and y, both included.
	 * @param x
	 * @param y
	 * @returns {*}
	 */
	randomIntXtoY: randomIntXtoY,

	/**
	 * Get random float between x and y, both included.
	 * @param x
	 * @param y
	 * @returns {*}
	 */
	randomFloatXtoY: randomFloatXtoY,

	/**
	 * Check if a percent chance is successful.
	 * @param {int} percent
	 * @returns {boolean}
	 */
	percentCheck(percent) {
		return randomIntXtoY(1, 100) <= percent;
	},

	randomItem(array) {
		return array[randomIntXtoY(0, array.length - 1)];
	}
};

module.exports = random;
