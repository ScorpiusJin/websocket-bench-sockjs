/*global module, require, process*/

var path = require('path');
var http = require('http');
var fs = require('fs');

http.globalAgent.maxSockets = 20000;

var logger = require('./logger'),
	server = process.argv[2],
	generatorFile = process.argv[3],
	workerType = process.argv[4],
	verbose = process.argv[6] === 'true',
    reportingPath = process.argv[7],
    executionUid = process.argv[8],
    executionDate = process.argv[9];

var scenarioName = path.basename(generatorFile, '.js');


var loggerFilePath = reportingPath + "/REPORT-" + executionUid + "-" + scenarioName + "-" + executionDate + "-" + process.pid + ".out";


var loggerOutputStream = fs.createWriteStream(loggerFilePath);

logger.setOutputStream(loggerOutputStream);

global.logger = logger;

logger.info("Logger file path: '" + loggerFilePath + "'");

if (!generatorFile || generatorFile === 'undefined') {
	generatorFile = './generator.js';
}

var generator = require(generatorFile);
var BenchmarkWorker = null;

switch (workerType) {
	case 'sockjs':
		BenchmarkWorker = require('./workers/sockjsworker.js');
		break;
	default:
		logger.error('error workerType ' + workerType);
}

var worker = new BenchmarkWorker(server, generator, verbose, reportingPath, executionUid, executionDate, scenarioName);

process.on('message', function (message) {
	if (message.msg === 'close') {
		worker.close();
		process.exit();
	}

	if (message.msg === 'run') {
		worker.launch(message.number, message.requestRamp);
	}
});

// On ctrl+c
process.on('SIGINT', function () {
	worker.close();
	setTimeout(function () {
		process.exit();
	}, 3000);
});

