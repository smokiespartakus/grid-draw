const colorR = "\033[1;38;5;160m";
const colorY= "\033[1;38;5;220m";
const colorC = "\033[1;38;5;121m";
const colorEnd = "\033[0;0m";
const colorGreen = "\u001b[32m";
const colorYellow = "\u001b[33m";
const colorMagenta = "\u001b[35m";
const colorBlue = "\u001b[34m";
const colorRed = "\u001b[31m";
const colorCyan = "\u001b[36m";

const init = function(config, file) {
	const levelDebug = config.debugLevel >=4;
	const levelInfo = config.debugLevel >=3;
	const levelWarn = config.debugLevel >=2;
	const levelError = config.debugLevel >=1;
	let extraKey = null;
	const logger = {
		isDebugEnabled: config.debug && levelDebug,
		isInfoEnabled: config.debug && levelInfo,
		isWarnEnabled: config.debug && levelWarn,
		isErrorEnabled: config.debug && levelError,
		log() {
			if( config.debug && levelDebug ) {
				console.log.apply(this, addTimestamp(arguments, 'd'));
			}
		},
		debug() {
			if( config.debug && levelDebug ) {
				console.log.apply(this, addTimestamp(arguments, 'd'));
			}
		},
		info() {
			if( config.debug && levelInfo )
				console.log.apply(this, addTimestamp(arguments, 'i'));
		},
		warn() {
			if( config.debug && levelWarn )
				console.log.apply(this, addTimestamp(arguments, 'w'));

		},
		warning() {
			if( config.debug && levelWarn )
				console.log.apply(this, addTimestamp(arguments, 'w'));

		},
		error() {
			if( config.debug && levelError )
				console.log.apply(this, addTimestamp(arguments, 'e'));
		},
		always() {
			console.log.apply(this, addTimestamp(arguments, 'i'));
		},
		setExtraKey(key) {
			extraKey = key;
		},
		red() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'red'));
		},
		green() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'green'));
		},
		blue() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'blue'));
		},
		yellow() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'yellow'));
		},
		magenta() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'magenta'));
		},
		cyan() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'cyan'));
		},
		purple() {
			if ( config.debug && levelInfo)
				console.log.apply(this, addTimestamp(arguments, 'd', 'magenta'));
		},
		getColorStart(color) {
			return getColor2(color);
		},
		getColorEnd() {
			return colorEnd;
		},
	};
	function addTimestamp(args, level, color) {
		let t = new Date();
		let ms = t.getMilliseconds();
		ms *= ms < 10 ? 100 : (ms < 100 ? 10 : 1);
	//	var zeros = (x) => { return ('0' + x).slice(-2); } // netbeans complains even though it works

		let tt = t.getFullYear() + '-' + zeros(t.getMonth() + 1) + '-' + zeros(t.getDate())
				+ ' ' + zeros(t.getHours()) + ':' + zeros(t.getMinutes()) + ':' + zeros(t.getSeconds()) + '.' + ms;
		for (let i=args.length-1; i>=0; i--) {
			args[i+1] = args[i];
		}
		if (color) args[0] = getColor2(color);
		else if (config.showDebugColors) args[0] = getColor(level);
		else args[0] = '';
		args[0] += "[" + tt + "]";
		if (level) args[0] += "[" + level + "]";
		args[0] += "[" + file + "]";
		if (extraKey) args[0] += "[" + extraKey + "]";
		if (config.showDebugColors || color) args[0] += colorEnd;
		args.length++;
		return args;
	}
	return logger;
};
function zeros(x) { return ('0' + x).slice(-2); }

function getColor(level) {
	switch(level) {
		case 'i': return colorC;
		case 'd': return '';
		case 'w': return colorY;
		case 'e': return colorR;
		default: return '';
	}
}
function getColor2(color) {
	switch (color) {
		case 'red': return colorRed;
		case 'green': return colorGreen;
		case 'blue': return colorBlue;
		case 'yellow': return colorYellow;
		case 'magenta': return colorMagenta;
		case 'cyan': return colorCyan;
	}
	return '';
}
module.exports.init = init;
