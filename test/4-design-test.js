// jshint settings
/*global exports: false, require: false*/

/**
 * 1) save design document
 * 2) get view info
 * 3) set validation handler
 * 4) get validation handler
 * 5) create rewrite
 * 6) get rewrite list
 * 7) starting compaction
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
  'message': 'get view info',
  'callpath': 'design.viewInfo',
  'url': ['GET', config.database + '/_design/' + config.design + '/_info'],
  'callback': function(error, info) {
    expect(info).to.be.an('object').and.to.have.property('name', config.design);
  }
}, {
  'message': 'set validation handler',
  'callpath': 'design.validateHandler',
  'arguments': ['function() {}'],
  'return': function(result) {
    expect(result).to.be.an('object').and.to.have.property('_body');
  }
}, {
  'message': 'get validation handler',
  'callpath': 'design.validateHandler',
  'return': function(result) {
    expect(result).to.be.an('string').and.to.be.equal('function() {}');
  }
}, {
  'message': 'create rewrite',
  'callpath': 'design.rewrites',
  'arguments': [[{'from': '/foo/bar', 'to': '/bar/foo'}]],
  'return': function(result) {
    expect(result).to.be.an('object').and.to.have.property(
      '_id',
      '_design/' + config.design
    );
  }
}, {
  'message': 'get rewrite list',
  'callpath': 'design.rewrites',
  'return': function(result) {
    expect(result).to.be.an('array').and.to.have.length(1);
    expect(result).to.be.deep.equal([{
      'from': '/foo/bar',
      'to': '/bar/foo'
    }]);
  }
}, {
  'message': 'starting compaction',
  'callpath': 'design.compact',
  'url': ['POST', config.database + '/_compact/' + config.design],
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}];