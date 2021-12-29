/**
 * @TODO Make sure JSON exists... Or do something else?
 *
 * let config = {
 *		debug: false,
 *		autoReconnect: true,
 *		onopen: function() {console.log('connection open');},
 *		onclose: function() {console.log('connection closed');},
 *		onmessage: function(message) {console.log('message received', message);},
 *		onsubscribe: function(channel) {console.log('subscribed to', channel);},
 *		onunsubscribe: function() {console.log('unsubscribed from', channel);},
 *	};
 * usage:
 * TrophyWebsocket.connect('my-app-id', config).subscribe('my-channel');
 */
(function(window) {
	function ws() {
		let _config = {};
		let _self = this;
//		let _wsurl = "ws://localhost:3050/{0}";
		let _wsProto = 'ws:';
		if (window.document.location.protocol == 'https:') _wsProto = 'wss:';
		let _wsurl = _wsProto + '//' + window.document.location.host + '/{0}';
		let _gameId = '';
		let _ws;
		let _connected = false;
		let _manualClose = false;
		let _channels = {};
		this.connect = function(config) {
			_config = _setConfig(config);
			_open();
			// _gameId = gameId;
			_ws.onopen = function(socket) {
				log("open", socket);
				_connected = true;
				_manualClose = false;
//				for (var i in _channels) {
//					if (_channels[i])
//						_subscribe(i);
//				}
				console.log('ON OPEN', _config.onopen);
				if (_config.onopen)
					_config.onopen();
			};

			_ws.onclose = function(socket) {
				log("close", socket);
				_connected = false;
				if (!_manualClose && _config.autoReconnect)
					setTimeout(_open, 500);

				if (_config.onclose)
					_config.onclose();
			};

			_ws.onerror = function() {
				if (_config.autoReconnect)
					setTimeout(_open, 500);

				if (_config.onerror)
					_config.onerror();
			};

			_ws.onmessage = function(message) {
				log("message", message.data);
				const data = JSON.parse(message.data);
				log('data', data);
				if (_config.onmessage)
					_config.onmessage(data);
			};

			return _self;
		};
		
		this.subscribe = function(channel) {
			_channels[channel] = true;
			if (_connected) 
				_subscribe(channel);
			return _self;
		};

		this.unsubscribe = function(channel) {
			_channels[channel] = false;
			if (_connected) 
				_unsubscribe(channel);
			return _self;
		};
		
		this.close = function() {
			_manualClose = true;
			_ws.close();
		};
		this.send = function(data) {
			if(!_ws) return;
			
			_ws.send(JSON.stringify(data));
		};

		function _open() {
			log('open', _wsurl);
			_ws = new WebSocket(_format(_wsurl, _gameId));
		}

		function log() {
			if (_config.debug) {
				console.log.apply(this, arguments);
//				var ar = [];
//				for(var i in arguments) ar.push(arguments[i]);
//				$('#log').prepend('<hr />' + ar.join(' '));

			}
		}

		function _setConfig(config) {
			config = config || {};
			const def = {
				debug: false,
				autoReconnect: true,
				onopen: null,
				onclose: null,
				onmessage: null,
				onsubscribe: null,
				onunsubscribe: null,
			};
			for (let i in def) {
				if (typeof config[i] == undefined)
					config[i] = def[i];
			}
			return config;
		}
		function _format(str, ...args) {
		    return str.replace(/{(\d+)}/g, function(match, number) {
	      		return typeof args[number] != 'undefined'
				   ? args[number] 
				   : match
				;
			});
		};
		return _self;
	}
	window.Websocket = new ws();
})(window);
