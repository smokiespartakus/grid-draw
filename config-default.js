module.exports = {
	appName: 'Grid Draw',
	environment: 'local',
	appUrl: 'grid',
	statusPage: {
		bodyBG: '#222277',
	},
	debug: true,
	debugLevel: 4, // 4=debug, 3=info, 2=warning, 1=error, 0=off
	showDebugColors: false,
	mode: 'single', // redis/cluster/single
	// **testing
	//timerMultiplier: 0.01,
	// */testing
	server: {
		port: 3050,
		domain: null,
	},
};
