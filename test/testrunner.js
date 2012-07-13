// jshint settings
/*global require: false, __dirname: false, it: false */

var expect = require('chai').expect,
    tests = [],
    config = require('./config.js'),
    cushion = {};

cushion.connection = new (require('../cushion.js').Connection)(
  config.host,
  config.port,
  config.username,
  config.password
);
cushion.database = cushion.connection.database(config.database);
cushion.document = cushion.database.document(config.document);
cushion.design = cushion.database.document('_design/' + config.design);
cushion.design.list(
  config.list,
  'function(head, request) {' +
    'var row;' +
    'start({"headers": {"Content-Type": "text/plain"}});' +
    'while(row = getRow()) {send(row.value._id);}' +
  '}'
);
cushion.design.show(
  config.show,
  'function(document, request) {' +
    'return {' +
      'body: "Hello " + JSON.stringify(request.query) + " " + request.id' +
    '};' +
  '}'
);
cushion.design.view(config.view, 'function(doc) {emit(doc._id, doc);}');

// get tests
require('fs').readdirSync(__dirname).filter(
  function(element, index, array) {
    return (element.match(/^\d{1}-[a-z]{1,}-test\.js$/) !== null);
  }
).sort().forEach(function(fileName, index, files) {
  tests = tests.concat(require(__dirname + '/' + fileName).tests);
});


// run tests
var testCaller = function() {
  var test = tests.shift(),
      callpath;

  if (test) {
    callpath = test.callpath.split('.');

    it(test.message, function(done) {
      cushion[callpath[0]][callpath[1]].apply(
        cushion[callpath[0]],
        (test.arguments || []).concat([function() {
          expect(arguments[0]).to.be.null;
          test.callback.apply(null, arguments);
          done();
          testCaller();
        }])
      );
    });
  }
};


// start testing
testCaller();
