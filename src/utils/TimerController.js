const config = require('../../config');
const logger = require('./logger').init(config, require('path').basename(__filename));
const Random = require('./random');
const Timer = require('./Timer');

class TimerController {
	timeMultiplier = 1;
	/**
	 * @type {Timer}
	 */
	// latestTimer = null;

	/**
	 * @type {{Timer}}
	 */
	timers = {};

	/**
	 * @param callback
	 * @param delay
	 * @param name
	 * @returns {Timer}
	 */
	runTimer(callback, delay, name) {
		// if (this.latestTimer && !this.latestTimer.isEnded()) logger.warn('Timer running', this.latestTimer.name);
		// this.latestTimer = timer;
		const timer = new Timer(callback, delay * this.timeMultiplier, name);
		this.timers[timer.timeoutId] = timer;
		timer.onEnd = (t) => {
			delete this.timers[t.timeoutId];
		};
		return timer;
	}

	pauseAll() {
		Object.values(this.timers).forEach((t) => {
			if (!t.isEnded()) t.pause();
		});
	}

	resumeAll() {
		Object.values(this.timers).forEach((t) => {
			if (!t.isEnded()) t.resume();
		});
	}
}

module.exports = TimerController;
