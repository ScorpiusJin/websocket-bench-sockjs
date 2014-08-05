/*global module, require*/

/**
 * Class for metrics
 */
var Monitor = function () {
	this.results = {
		connection: 0,
		disconnection: 0,
		errors: 0
	};
	this.counter = 0;
};


Monitor.prototype.connection = function () {
	this.results.connection++;
	this.counter++;
};

Monitor.prototype.disconnection = function () {
	this.results.disconnects++;
	this.counter++;
};

Monitor.prototype.errors = function () {
	this.results.errors++;
	this.counter++;
};

/**
 * Merge metrics
 */
Monitor.prototype.merge = function (monitor) {
	this.results.connection += monitor.results.connection;
	this.results.disconnection += monitor.results.disconnection;
	this.results.errors += monitor.results.errors;
	this.counter += monitor.counter;
};

module.exports = Monitor;
