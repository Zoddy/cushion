// jshint settings
/*global exports: false, require: false*/

/**
 * 1) check for existing
 * 2) create database
 * 3) getting info
 * 4) start compaction
 * 5) start cleanup
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'check for existing',
  'callpath': 'database.exists',
  'callback': function(error, exists) {
    expect(exists).to.be.false;
  }
}, {
  'message': 'create database',
  'callpath': 'database.create',
  'callback': function(error, created) {
    expect(created).to.be.true;
  }
}, {
  'message': 'getting info',
  'callpath': 'database.info',
  'callback': function(error, info) {
    expect(info).to.be.an('object').and.to.have.property('doc_count');
  }
}, {
  'message': 'start compaction',
  'callpath': 'database.compact',
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}, {
  'message': 'start cleanup',
  'callpath': 'database.cleanup',
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}];