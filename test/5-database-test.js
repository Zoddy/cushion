// jshint settings
/*global exports: false, require: false*/

/**
 *  1) getting all documents
 *  2) getting all documents with query params
 *  3) retrieving view
 *  4) retrieving view with query params
 *  5) retrieving list
 *  6) retrieving show
 *  7) retrieving show with query params
 *  8) retrieving show with document id
 *  9) retrieving show with document id and query params
 * 10) delete database
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'getting all documents',
  'callpath': 'database.allDocuments',
  'url': ['GET', config.database + '/_all_docs'],
  'callback': function(error, info, documents) {
    expect(info).to.be.an('object').and.to.have.property('total', 2);
    expect(documents)
      .to.be.an('object')
      .and.to.have.property('_design/test_design');
  }
}, {
  'message': 'getting all documents with query params',
  'callpath': 'database.allDocuments',
  'arguments': [{'skip': 1}],
  'url': ['GET', config.database + '/_all_docs?skip=1'],
  'callback': function(error, info, documents) {
    expect(info).to.be.an('object').and.to.have.property('total', 2);
    expect(info).to.have.property('offset', 1);
    expect(documents)
      .to.be.an('object')
      .and.to.have.property(config.document + '_copy');
  }
}, {
  'message': 'retrieving view',
  'callpath': 'database.view',
  'arguments': [config.design, config.view],
  'url': [
    'GET',
    config.database + '/_design/' + config.design + '/_view/' + config.view
  ],
  'callback': function(error, info, result) {
    expect(info).to.be.an('object').and.to.have.property('total', 1);
    expect(result)
      .to.be.an('object')
      .and.to.have.property(config.document + '_copy');
  }
}, {
  'message': 'retrieving view with query params',
  'callpath': 'database.view',
  'arguments': [config.design, config.view, {'skip': '1'}],
  'url': [
    'GET',
    config.database +
    '/_design/' + config.design +
    '/_view/' + config.view +
    '?skip=1'
  ],
  'callback': function(error, info, result) {
    expect(info).to.be.an('object').and.to.have.property('total', 1);
    expect(info).to.have.property('offset', 1);
    expect(result).to.be.an('object').and.to.be.empty;
  }
}, {
  'message': 'retrieving list',
  'callpath': 'database.list',
  'arguments': [config.design, config.list, config.view],
  'url': [
    'GET',
    config.database +
    '/_design/' + config.design +
    '/_list/' + config.list +
    '/' + config.view
  ],
  'callback': function(error, result) {
    expect(result).to.be.a('string').and.to.be.equal(config.document + '_copy');
  }
}, {
  'message': 'retrieving show',
  'callpath': 'database.show',
  'arguments': [config.design, config.show],
  'url': [
    'GET',
    config.database + '/_design/' + config.design + '/_show/' + config.show
  ],
  'callback': function(error, result) {
    expect(result).to.be.a('string').and.to.be.equal('Hello {} null');
  }
}, {
  'message': 'retrieving show with query params',
  'callpath': 'database.show',
  'arguments': [config.design, config.show, {'foo': 'foobar'}],
  'url': [
    'GET',
    config.database +
    '/_design/' + config.design +
    '/_show/' + config.show +
    '?foo=foobar'
  ],
  'callback': function(error, result) {
    expect(result)
      .to.be.a('string')
      .and.to.be.equal('Hello {"foo":"foobar"} null');
  }
}, {
  'message': 'retrieving show with document id',
  'callpath': 'database.show',
  'arguments': [config.design, config.show, config.document + '_copy'],
  'url': [
    'GET',
    config.database +
    '/_design/' + config.design +
    '/_show/' + config.show +
    '/' + config.document + '_copy'
  ],
  'callback': function(error, result) {
    expect(result)
      .to.be.a('string')
      .and.to.be.equal('Hello {} ' + config.document + '_copy');
  }
}, {
  'message': 'retrieving show with document id and query params',
  'callpath': 'database.show',
  'arguments': [
    config.design,
    config.show,
    config.document + '_copy',
    {'foo': 'foobar'}
  ],
  'url': [
    'GET',
    config.database +
    '/_design/' + config.design +
    '/_show/' + config.show +
    '/' + config.document + '_copy' +
    '?foo=foobar'
  ],
  'callback': function(error, result) {
    expect(result)
      .to.be.a('string')
      .and.to.be.equal('Hello {"foo":"foobar"} ' + config.document + '_copy');
  }
}, {
  'message': 'delete database',
  'callpath': 'database.destroy',
  'url': ['DELETE', config.database],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}];
