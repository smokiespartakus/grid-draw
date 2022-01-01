const path = require('path');
const rootDir = path.dirname(path.join(__dirname, '..'));
const publicDir = path.join(rootDir, 'public');
const viewDir = path.join(rootDir, 'views');
module.exports = {
	root: rootDir,
	public: publicDir,
	views: viewDir,
};