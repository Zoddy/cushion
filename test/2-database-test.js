// jshint settings
/*global exports: false, require: false*/

/**
 * 1) check for existing
 * 2) get name of database
 * 3) create database
 * 4) getting info
 * 5) start compaction
 * 6) start cleanup
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'check for existing',
  'callpath': 'database.exists',
  'url': ['GET', config.database],
  'callback': function(error, exists) {
    expect(exists).to.be.false;
  }
}, {
  'message': 'get name of database',
  'callpath': 'database.name',
  'return': function(result) {
    expect(result).to.be.a('string').and.to.be.equal(config.database);
  }
}, {
  'message': 'create database',
  'callpath': 'database.create',
  'url': ['PUT', config.database],
  'callback': function(error, created) {
    expect(created).to.be.true;
  }
}, {
  'message': 'getting info',
  'callpath': 'database.info',
  'url': ['GET', config.database],
  'callback': function(error, info) {
    expect(info).to.be.an('object').and.to.have.property('doc_count');
  }
}, {
  'message': 'start compaction',
  'callpath': 'database.compact',
  'url': ['POST', config.database + '/_compact'],
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}, {
  'message': 'start cleanup',
  'callpath': 'database.cleanup',
  'url': ['POST', config.database + '/_view_cleanup'],
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}];