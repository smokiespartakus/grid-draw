const glob = require( 'glob' );
const path = require( 'path' );
// const fs = require ( 'fs' );
// //
// const logger = require('../../utils/logger').init(path.basename(__filename));

const dontLoad = ['index'];

const errors = {};
// const types = {};
glob.sync( 'src/errors/*.js' ).forEach( function( file ) {
	const effectName = path.posix.basename(file).replace('.js', '');
	if (dontLoad.indexOf(effectName) === -1) {
		// console.log('load effect', effectName);
		errors[effectName] = require( path.resolve( file ) );
		// types[effectName.toUpperCase()] = effectName;
	}
});

// Save all effects to effect_type, so I don't have to do it manually.
module.exports = errors;

