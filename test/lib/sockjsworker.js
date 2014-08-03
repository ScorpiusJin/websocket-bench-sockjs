/*global require, describe, it, beforeEach, afterEach*/
var mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  should = chai.should(),
  SockJS =  require('node-sockjs-client-aki');

var SockJSWorker = require('../../lib/workers/sockjsworker.js'),
  BaseWorker = require('../../lib/workers/baseworker.js'),
  Monitor = require('../../lib/monitor.js');

describe('SockJSWorker', function () {
  describe('#constructor', function () {
    it('Should be an instance of base worker', function () {
      var worker = new SockJSWorker('server', {});

      worker.should.be.instanceof(BaseWorker);
    });
  });

  describe('#createClient', function () {
    it('create a SockJS client', function (done) {
      var worker = new SockJSWorker('server', {});
      worker.createClient(function (err, client) {
        client.should.be.instanceof(SockJS);
        done();
      });
    });
  });
});
