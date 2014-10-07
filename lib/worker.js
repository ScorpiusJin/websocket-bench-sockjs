/*global module, require, process*/

var http = require('http');
http.globalAgent.maxSockets = 20000;

var logger = require('./logger'),
	server = process.argv[2],
	generatorFile = process.argv[3],
	workerType = process.argv[4],
	verbose = process.argv[6] === 'true',
    reportingPath = process.argv[7];

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

var worker = new BenchmarkWorker(server, generator, verbose, reportingPath);

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

