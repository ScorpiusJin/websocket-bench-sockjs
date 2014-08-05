/*global module, require*/

var logger = require('./logger');

module.exports = {

	/**
	 * Before connection
	 * @param {client} client connection
	 */
	beforeConnect: function (client) {
		// Some code
	},

	/**
	 * on socket io connect
	 * @param {client} client connection
	 * @param {done}   callback function(err) {}
	 */
	onConnect: function (client, done) {
		// Some code
		done();
	}

};
