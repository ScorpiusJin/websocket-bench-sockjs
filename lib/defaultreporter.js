/*global module, require*/
var Table = require('cli-table');
var stripColorCodes = require('stripcolorcodes');

/**
 * Class for display bench result
 */
var DefaultReporter = function (outputStream) {

    this.outputStream = outputStream;

};

DefaultReporter.prototype.report = function (steps, monitor, stopwatch) {

    var self = this;
    var write = function(message) {
        if (self.outputStream != undefined) {
            self.outputStream.write(stripColorCodes(message));
        }
        process.stdout.write(message);
    };

    var tableSteps = new Table({
        head: ['Number', 'Connections', 'Errors', 'Duration(ms)']
    });

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];

        tableSteps.push([
            step.number,
            step.monitor.results.connection,
            step.monitor.results.errors,
            step.stopwatch.getDuration()
        ]);
    }

    write('\n');
    write('#### steps report ####'.inverse + '\n');
    write(tableSteps.toString() + '\n');

    var tableTotal = new Table({
        head: ['Number', 'Connections', 'Errors', 'Duration(ms)']
    });

    tableTotal.push([
        monitor.counter,
        monitor.results.connection,
        monitor.results.errors,
        stopwatch.getDuration()
    ]);

    write('#### total report ####'.inverse + '\n');
    write(tableTotal.toString() + '\n');

};

module.exports = DefaultReporter;