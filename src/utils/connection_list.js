/**
 * Connection list class. Should be it's own file and required instead of this.
 * @returns {ConnectionList}
 */
function ConnectionList() {
	const _connections = {};
	this.size = () => {
		return utils.countObj(_connections);
	};
	this.has = (uuid) => {
		return !!_connections[uuid];
	};
	this.get = (uuid) => {
		return _connections[uuid] || {};
	};
	this.add = (uuid, connection) => {
		_connections[uuid] = connection;
	};
	this.remove = (uuid) => {
		delete _connections[uuid];
	};
}

module.exports = ConnectionList;