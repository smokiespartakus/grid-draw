const config = require('../../config');
const logger = require('./logger').init(config, require('path').basename(__filename));
const Random = require('./random');

class Timer {
	remaining = 0;
	timeoutId = null;
	start = null;
	ended = null;
	callback = null;
	onEnd = null;
	constructor(callback, delay, name) {
		this.remaining = delay;
		this.callback = callback;
		this.name = name;
		this.resume();
	}

	pause() {
		clearTimeout(this.timeoutId);
		this.remaining -= Date.now() - this.start;
	}

	resume() {
		this.start = Date.now();
		clearTimeout(this.timeoutId);
		this.timeoutId = setTimeout(() => {
			this._runCallback();
		}, this.remaining);
	}

	clear() {
		clearTimeout(this.timeoutId);
		this._end();
	}

	isEnded() {
		return !!this.ended;
	}

	_runCallback() {
		this._end();
		this.callback();
	}

	_end() {
		this.ended = Date.now();
		if (this.onEnd) this.onEnd(this);
	}
}

module.exports = Timer;
