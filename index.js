/*global require, process*/

var Benchmark = require('./lib/benchmark.js'),
	DefaultReporter = require('./lib/defaultreporter.js'),
	fs = require('fs'),
	os = require('os'),
	program = require('commander'),
	logger = require('./lib/logger'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    Chance = require('chance'),
    moment = require('moment'),
    jsonPackage = require('./package.json');

var startupDate = moment();

var chance = new Chance();

program
	.version(jsonPackage != undefined ? jsonPackage.version : "0.0.0")
	.usage('[options] <server>')
	.option('-a, --amount <n>', 'Total number of persistent connection, Default to 100', parseInt)
	.option('-w, --worker-ramp <n>', 'Worker ramp in ms, Default to 5', parseInt)
	.option('-r, --request-ramp <n>', 'Request ramp in ms, Default to 5', parseInt)
	.option('-W, --worker <n>', 'number of worker', parseInt)
	.option('-g, --generator <file>', 'js file for generate message or special event')
	.option('-t, --type <type>', 'type of websocket server to bench(sockjs). Default to io')
    .option('-u --type <value>', 'uid of execution')
    .option('-p, --transport <type>', 'type of transport to websocket (websockets, sockjs). Default to websockets')
    .option('-R, --reporting-path <path>', 'path of directory for reporting')
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

if (!program.reportingPath) {
    program.reportingPath = process.cwd() + '/reporting';
}

program.reportingPath = path.join(program.reportingPath, startupDate.format("YYYY-MM-DD"));

if (!program.generator) {
	program.generator = __dirname + '/lib/generator.js';
}

if (program.generator.indexOf('/') !== 0) {
	program.generator = process.cwd() + '/' + program.generator;
}

if (!program.uid) {
    program.uid = chance.string({length: 6, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' });
}


if (!program.type) {
	program.type = 'sockjs';
}

logger.info('Launch bench with :');
logger.info(" - " + program.amount + " total connection");
logger.info(" - " + program.requestRamp + "ms request ramp");
logger.info(" - " + program.workerRamp + "ms worker ramp");
logger.info(" - " + program.worker + " worker(s)");
logger.info(" - Reporting path: '" + program.reportingPath + "'");
logger.info(" - WS server : '" + program.type +"'");

var options = {
	generatorFile: program.generator,
	type: program.type,
	transport: program.transport,
	verbose: program.verbose,
    reportingPath: program.reportingPath,
    executionUid: program.uid,
    executionDate: startupDate.format("YYYYMMDDHHmmss")
};

if (program.verbose) {
	logger.debug("Benchmark Options " + JSON.stringify(options));
}


mkdirp(program.reportingPath, function(err) {
    if (err) {
        console.error("Could not create reporting directory on path: '" + program.reportingPath + "' - Error: " + JSON.stringify(err));
        process.exit(1);
    }

    var  reportFilePath = options.reportingPath + "/REPORT-" + options.executionUid + "-" + path.basename(options.generatorFile, '.js') + "-" + options.executionDate + ".out";
    logger.info("Report file path: '" + reportFilePath + "'");
    var outputStream = fs.createWriteStream(reportFilePath);

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
});
