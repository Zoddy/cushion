// jshint settings
/*global exports: false, require: false*/

/**
 * 1) save design document
 * 2) starting compaction
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'save design document',
  'callpath': 'design.save',
  'url': [
    'PUT',
    config.database + '/_design/' + config.design,
    {
      lists: {
        test_list: 'function(head, request) {' +
          'var row;start({"headers": {"Content-Type": "text/plain"}});' +
          'while(row = getRow()) {send(row.value._id);}' +
        '}'
      },
      shows: {
        test_show: 'function(document, request) {' +
          'return {' +
            'body: "Hello " + JSON.stringify(request.query) + " " + request.id' +
          '};' +
        '}'
      },
      views: {
        test_view: { map: 'function(doc) {emit(doc._id, doc);}' }
      }
    }
  ],
  'callback': function(error, document) {
    expect(document).to.be.an('object').and.to.respondTo('view');
  }
}, {
  'message': 'starting compaction',
  'callpath': 'design.compact',
  'url': ['POST', config.database + '/_compact/' + config.design],
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}];