/*global module, require*/

//npm
var colors = require('colors');
var moment = require('moment');

//Set Basic Theme
colors.setTheme({
	info: 'green',
	debug: 'cyan',
	warn: 'yellow',
	error: 'red'
});

var os = undefined;

/**
 * Logging Container
 * @type {{info: info, debug: debug, warn: warn, error: error}}
 */
module.exports = {

    setOutputStream: function(_os) {
        os = _os;
    },

	_helpers: {
		/**
		 * Stringify Object When Logging
		 * @param item
		 * @returns {*}
		 */
		stringifyIfObj: function (item) {
			if (typeof item === 'object') {
				item = JSON.stringify(item);
			}
			return item;
		}
	},

	info: function (msg) {
        var date = moment().format('HH:mm:ss');
        if (os != undefined) {
            os.write("[" + date + "][INFO] " + this._helpers.stringifyIfObj(msg));
        }
		console.info("[" + date + "][INFO] " + this._helpers.stringifyIfObj(msg).info);
	},

    log: function (msg) {
        var date = moment().format('HH:mm:ss');
        if (os != undefined) {
            os.write("[" + date + "][INFO] " + this._helpers.stringifyIfObj(msg));
        }
        console.info("[" + date + "][INFO] " + this._helpers.stringifyIfObj(msg).info);
    },

	debug: function (msg) {
        var date = moment().format('HH:mm:ss');
        if (os != undefined) {
            os.write("[" + date + "][DEBUG] " + this._helpers.stringifyIfObj(msg));
        }
		console.log("[" + date + "][INFO] " + this._helpers.stringifyIfObj(msg).debug);
	},

	warn: function (msg) {
        var date = moment().format('HH:mm:ss');
        if (os != undefined) {
            os.write("[" + date + "][WARN] " + this._helpers.stringifyIfObj(msg));
        }
		console.warn("[" + date + "][WARN] " + this._helpers.stringifyIfObj(msg).warn);
	},

	error: function (msg) {
        var date = moment().format('HH:mm:ss');
        if (os != undefined) {
            os.write("[" + date + "][ERROR] " + this._helpers.stringifyIfObj(msg));
        }
		console.error("[" + date + "][ERROR] " + this._helpers.stringifyIfObj(msg).error);
	}
};
