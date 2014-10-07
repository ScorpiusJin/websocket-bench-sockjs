/*global module, require*/

var Monitor = require('../monitor.js'),
	logger = require('../logger.js'),
    csv = require('fast-csv'),
    fs = require('fs'),
    moment = require('moment'),
    uuid = require('uuid'),
    util = require('util'),
    _ = require('underscore');


var workers = {};

/**
 * BaseWorker constructor
 * @param {server}    server
 * @param {generator} generator
 * @param {verbose} verbose logging
 */
var BaseWorker = function (server, generator, verbose, reportingPath) {
    var reporter = createReporter(reportingPath);
    this.uid = uuid.v4();
	this.server = server;
    this.reporter = reporter;
	this.generator = new generator(server, reporter);
	this.clients = [];
	this.running = true;
	this.verbose = verbose;
    this.reportingPath = reportingPath;

    workers[this.uuid] = this;
};

var createReporter = function(reportingPath) {
    var csvStream = csv.createWriteStream({headers: true, delimiter: ';'}).transform(function(obj){
        return _.extend({
            pid: "",
            type: "",
            date: "",
            clientUid: "",
            countDone: "",
            duration: "",
            errName: "",
            errType: "",
            errMessage: "",
            token: "",
            secret: "",
            counter: "",
            connection: "",
            disconnection: "",
            errors: ""
        }, obj);
    });

    var writableStream = fs.createWriteStream(reportingPath + "/reporting-" + moment().format('YYYYMMDD-HHmmss') + "-" + process.pid + ".csv");

    csvStream.pipe(writableStream);

    return csvStream;
};

/**
 * launch client creation and message
 * @param {number}    number
 * @param {messageNumber} messageNumber
 */
BaseWorker.prototype.launch = function (number, requestRamp) {
	var self = this;
	var monitor = new Monitor();

    (function myLoop(i) {
		setTimeout(function () {
			self.createClient(monitor, function (err, client) {
                client.report = function (data) {
                    self.reporter.write(data);
                };
				self.clients.push(client);
				self._onClientCreation(client, monitor, err);
			});
			if (--i) myLoop(i);      //  decrement i and call myLoop again if i > 0
		}, requestRamp);
	})(number);

	var testDone = function () {
		if (!self._testLaunchDone(monitor, number)) {
			setTimeout(testDone, 250);
		}
	};

	testDone();
};

BaseWorker.prototype.createClient = function (callback) {
	logger.error('Not implement method create client');
};

/**
 * Close Method (must be redifined if client doesnt have a disconnect method)
 */
BaseWorker.prototype.close = function () {
	this.running = false;

	for (var i = 0; i < this.clients.length; i++) {
		try {
			if (this.clients[i]) {
				this.clients[i].disconnect();
			}
		} catch (err) {
			logger.error("--- Closing - Monitor / Err:" + err.message + " - " + err.stack);
		}
	}

    delete workers[this.uuid];
};

/**
 * _onClientCreation internal method
 * @api private
 */
BaseWorker.prototype._onClientCreation = function (client, monitor, err) {
	var _this = this;

	if (err) {
		monitor.errors();
	} else {
		_this.generator.onConnect(client, function (err) {
			if (err) {
				monitor.errors();
			} else {
				monitor.connection();
			}
		});
	}
};

/**
 * _testLaunchDone internal method
 * @api private
 */
BaseWorker.prototype._testLaunchDone = function (monitor, number) {
    var self = this;

	if (monitor.counter >= number) {
		process.send({ action: 'done', monitor: monitor });

        var data = {
            pid: process.pid,
            type: "MONITOR",
            date: moment().format("YYYY/MM/DD, HH:mm:ss.SSS"),
            counter: monitor.counter,
            connection: monitor.results.connection,
            disconnection: monitor.results.disconnection,
            errors: monitor.results.errors
        };
        console.log("Monitor: " + JSON.stringify(data));
        self.reporter.write(data);
        setTimeout(function () {
            self.reporter.end();
        }, 1000);

        return true;
	}

	return false;
};

process.on('uncaughtException', function(err) {
    console.error("[ERROR] Got UncaughtException - Error: " + util.inspect(err));
    console.error("[ERROR] Got UncaughtException - Stack: " + err.stack);

    for (var workerUID in workers) {
        var worker = workers[workerUID];
        if (worker.reporter) {
            setTimeout(function () {
                worker.reporter.end();
            }, 1000);
        }
    }
});

module.exports = BaseWorker;
