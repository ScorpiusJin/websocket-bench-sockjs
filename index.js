/*global require, process*/

var Benchmark = require('./lib/benchmark.js'),
	DefaultReporter = require('./lib/defaultreporter.js'),
	fs = require('fs'),
	os = require('os'),
	program = require('commander'),
	logger = require('./lib/logger');

program
	.version('0.1.4')
	.usage('[options] <server>')
	.option('-a, --amount <n>', 'Total number of persistent connection, Default to 100', parseInt)
	.option('-w, --worker-ramp <n>', 'Worker ramp in ms, Default to 5', parseInt)
	.option('-r, --request-ramp <n>', 'Request ramp in ms, Default to 5', parseInt)
	.option('-W, --worker <n>', 'number of worker', parseInt)
	.option('-g, --generator <file>', 'js file for generate message or special event')
	.option('-o, --output <output>', 'Output file')
	.option('-t, --type <type>', 'type of websocket server to bench(sockjs). Default to io')
	.option('-p, --transport <type>', 'type of transport to websocket (websockets, sockjs). Default to websockets')
	.option('-v, --verbose', 'Verbose Logging')
	.parse(process.argv);

if (program.args.length < 1) {
	program.help();
}

var server = program.args[0];

// Set default value
if (!program.worker) {
	program.worker = os.cpus().length;
}

if (!program.verbose) {
	program.verbose = false;
}

if (!program.amount) {
	program.amount = 100;
}

if (!program.workerRamp) {
    program.workerRamp = 5;
}

if (!program.requestRamp) {
    program.requestRamp = 5;
}

if (!program.generator) {
	program.generator = __dirname + '/lib/generator.js';
}

if (program.generator.indexOf('/') !== 0) {
	program.generator = process.cwd() + '/' + program.generator;
}


if (!program.type) {
	program.type = 'sockjs';
}

logger.info('Launch bench with :\n' +
	' - ' + program.amount + ' total connection\n' +
    ' - ' + program.requestRamp + 'ms request ramp\n' +
    ' - ' + program.workerRamp + 'ms worker ramp\n' +
	' - ' + program.worker + ' worker(s)\n' +
	" - WS server : '" + program.type + "'\n");

var options = {
	generatorFile: program.generator,
	type: program.type,
	transport: program.transport,
	verbose: program.verbose
};

if (program.verbose) {
	logger.debug("Benchmark Options " + JSON.stringify(options));
}

var outputStream = null;

if (program.output) {
	if (program.generator.indexOf('/') !== 0) {
		program.output = __dirname + '/' + program.generator;
	}
	outputStream = fs.createWriteStream(program.output);
}

var reporter = new DefaultReporter(outputStream);
var bench = new Benchmark(server, reporter, options);

// On ctrl+c
process.on('SIGINT', function () {
	logger.info("\nGracefully stoping worker from SIGINT (Ctrl+C)");

	setTimeout(function () {

		if (bench.monitor.isRunning()) {
			bench.terminate();
		}

	}, 2000);

});

bench.launch(program.amount, program.worker, program.requestRamp, program.workerRamp);

