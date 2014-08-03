(function () {

    var util = require('util'),
        uuid = require('uuid'),
        SockJS = require('node-sockjs-client-aki'),
        BaseWorker = require('./baseworker.js'),
        logger = require('../logger.js');

    /**
     * SocketIOWorker Worker class inherits form BaseWorker
     */
    var SockJSWorker = function (server, generator) {
        SockJSWorker.super_.apply(this, arguments);
    };

    util.inherits(SockJSWorker, BaseWorker);

    SockJSWorker.prototype.createClient = function (monitor, callback) {
        var self = this;

        var connect = function (session) {

            var client = new SockJS(self.server, {
	            timeout: 90 * 1000,
	            devel:false,
	            debug: false,
	            protocols_whitelist: ['websocket'],
	            info: {"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":1739246751}
            });
            client.uuid = monitor.uuid + '-' + uuid.v4();
            client.disconnect = function() { client.close(); };
            client.session = session;

            client.onopen = function () {
                client.open = true;
                if (self.verbose) {
                    logger.error("[WS][SockJS][OPEN]");
                }
                callback(false, client);
            };

            client.onerror = function () {
                if (self.verbose) {
                    logger.error("[WS][SockJS][ERROR]");
                }
                callback(true, client)
            }

            client.onclose = function (closeEvent) {
                if (!client.open && closeEvent.code != 1000 ) {
                    callback(true, client);
                    logger.error("*** Client close: " + util.inspect(closeEvent) + "Error:" + new Error().stack);
                }
                client.session = null;
                if (self.verbose) {
                    logger.error("[WS][SockJS][CLOSE]");
                }
            };
        };

        if (self.generator.beforeConnect) {
            var beforeConnect = self.generator.beforeConnect.bind(self);
            beforeConnect(function (err, session) {
                if (err != undefined) {
                    callback(err);
                }
                else {
                    connect(session);
                }
            });
        }
        else {
            connect({});
        }

    };

    module.exports = SockJSWorker;

})();