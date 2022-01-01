const path = require('path');
const rootDir = path.dirname(path.join(__dirname, '..'));

module.exports = {
	root: rootDir,
	public: path.join(rootDir, 'public'),
	views: path.join(rootDir, 'views'),
	storage: path.join(rootDir, 'storage'),
};
