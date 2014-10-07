/*global module, require*/
var Monitor = require('./monitor.js'),
	StopWatch = require('./stopwatch.js'),
	Steps = require('./steps.js'),
	logger = require('./logger.js'),
    _ = require('underscore');

/**
 * Constructor
 * @param {server} server to benchmark
 */
var Benchmark = function (server, reporter, options) {
	this.server = server;
	this.monitor = new Monitor();
	this.stopwatch = new StopWatch();
	this.steps = new Steps();
	this.workers = [];
	this.options = options || {};
	this.reporter = reporter;
};

/**
 * Launch
 * @param {connectNumber} number of connection
 * @param {requestRamp}   requestRamp worker ramp in ms
 * @param {workerRamp}    connection worker ramp in ms
 */
Benchmark.prototype.launch = function (connectNumber, workerNumber, requestRamp, workerRamp) {
	var self = this;
    var cp = require('child_process');

	this.current = {
		connectNumber: connectNumber,
        requestRamp: requestRamp,
        workerRamp: workerRamp
	};

    for (var i = 0 ; i < workerNumber ; i++) {

        var forkFilePath = __dirname + '/worker.js';
        var processExecArgv = _.map(process.execArgv, function(value) {
            if (value.indexOf("--debug-brk") >= 0) {
                return '--debug-brk=' + (5859 + i);
            }
            else if (value.indexOf("--debug") >= 0) {
                return '--debug=' + (5859 + i);
            }
            else {
                return value;
            }
        });

        console.log("Forking process with file at path: '" + forkFilePath + "' options: " + JSON.stringify(processExecArgv));
        self.workers[i] = cp.fork(forkFilePath, [
            self.server, self.options.generatorFile, self.options.type, self.options.transport, self.options.verbose, self.options.reportingPath
        ], { env: process.env, execArgv: processExecArgv });

        self.workers[i].on('message', self._onMessage.bind(self));
    }

	this.stopwatch.start();

	this._feedWorkers(connectNumber, requestRamp, workerRamp);
};

Benchmark.prototype._onMessage = function (message) {
	if (message.action === 'done') {
		this._processResult(message.monitor);
	}
};

/**
 * Launch next step
 * @param {connectNumber} number of connection
 * @param {requestRamp}   request ramp in ms
 * @param {workerRamp}    worker ramp in ms
 * @api private
 */
Benchmark.prototype._feedWorkers = function (connectNumber, requestRamp, workerRamp) {

    var self = this;

    var workerNumber = this.workers.length;

    (function myLoop(i) {
        setTimeout(function () {
            console.log("Start: " + i);

            var nbConnection = Math.round(connectNumber / workerNumber);

            if (i === 0) {
                nbConnection = connectNumber - nbConnection * (workerNumber - 1);
            }

            console.log("Connections: '" + nbConnection + "' for worker : '" + i + "'");

            var stepMonitor = new Monitor();
            var stepStopWatch = new StopWatch();

            stepStopWatch.start();

            self.steps.addStep(nbConnection, stepMonitor, stepStopWatch);

            self.workers[i].send({ msg: 'run', number: nbConnection, requestRamp: requestRamp });

            if (--i >= 0) myLoop(i);
        }, workerNumber - 1 == i ? 0 : workerRamp);
        console.log("Worker number: " + workerNumber + ", i: " + i);
    })(workerNumber - 1);

};

/**
 * Process result send by a worker
 * @param {monitor} Monitor send by the worker
 * @api private
 */
Benchmark.prototype._processResult = function (monitor) {
	this.monitor.merge(monitor);

	var step = this.steps.findStep(this.monitor.counter);

	step.monitor.merge(monitor);

	var previousStep = this.steps.previousStep(step);

	var numberForStep = (previousStep) ? step.number - previousStep.number : step.number;

	if (numberForStep === step.monitor.counter) {
		step.stopwatch.stop();
	}

	if (this.monitor.counter >= this.current.connectNumber) {

		this.terminate();
	}
};

/**
 * Terminate all running workers
 */
Benchmark.prototype.close = function () {
	for (var i = 0; i < this.workers.length; i++) {

		this.workers[i].send({ msg: 'close'});
	}
};

/**
 * Terminate and then display result
 */
Benchmark.prototype.terminate = function () {
	// Stop all running monitor
	this.stopwatch.stop();

	if (this.steps.getLastStep()) {
		this.steps.getLastStep().stopwatch.stop();
	}

	this.close();

	this._report();
};

/**
 * display result if a reporter is specified
 * @api private
 */
Benchmark.prototype._report = function () {
	if (this.reporter) {
		this.reporter.report(this.steps.getSteps(), this.monitor, this.stopwatch);
	}
};

module.exports = Benchmark;
