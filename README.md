# websocket bench

Nodejs cli tool for benchmarking websocket servers. It supports sockjs.

## Installation

   `npm install -g websocket-bench-sockjs`

## Running Tests/Linting

  First Install required dev-dependencies `npm install`
  Run Gulp Build Tool `gulp mocha`

## Usage

Tip: You may find it useful to increase the maximum number of open file descriptors on your system during testing:

`ulimit -n 60000`

Simple example:

`websocket-bench-sockjs -a 20000 -c 2000 --request-ramp=200 -g ./src/resources/scenarios/auth-0001.js http://localhost:8000/realtime`


command help

    Usage: websocket-bench-sockjs [options] <server>

    Options:

      -h, --help               Output usage information
      -V, --version            Output the version number
      -a, --amount <n>         Total number of persistent connection, Default to 100
      -c, --concurrency <n>     Concurrent connection per second, Default to 20
      -w, --worker <n>         Number of worker(s)
      -g, --generator <file>   Js file for generate message or special event
      -m, --message <n>        Number of message for a client. Default to 0
      -o, --output <output>    Output file
      -k, --keep-alive         Keep alive connection
      -v, --verbose            Verbose Logging


## Benchmark message

For benchmark message or more advanced connection you should provide your own `generator`

generator structure :

```javascript

    module.exports = {
       /**
        * Before connection (optional, just for faye)
        * @param {client} client connection
        */
       beforeConnect : function(client) {
         // Do something
       },

       /**
        * On client connection (required)
        * @param {client} client connection
        * @param {done} callback function(err) {}
        */
       onConnect : function(client, done) {
         // client.send('Sailing the seas of cheese');

         done();
       },

    };

```

## See also french article from origin code base :
 * [Benchmarking websockets avec Node.Js](http://tech.m6web.fr/benchmarking-websockets-avec-nodejs)
