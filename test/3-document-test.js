// jshint settings
/*global exports: false, require: false*/

/**
 * 1) save document
 * 2) load document
 * 3) copy document
 * 4) info about the document
 * 5) save attachment
 * 6) save attachment with custom name
 * 7) load attachment
 * 8) delete attachment
 * 9) delete attachment with custom name
 * 10) delete document
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'save document',
  'callpath': 'document.save',
  'callback': function(error, document) {
    expect(document).to.be.an('object').and.to.have.property('_id');
  },
}, {
  'message': 'load document',
  'callpath': 'document.load',
  'callback': function(error, document) {
    expect(document).to.be.an('object').and.to.have.property('_id');
    expect(document.id()).to.equal(config.document);
  }
}, {
  'message': 'copy document',
  'callpath': 'document.copy',
  'arguments': [config.document + '_copy'],
  'callback': function(error, source, target) {
    expect(source).to.be.an('object').and.to.have.property('_id');
    expect(source.id()).to.be.equal(config.document);
    expect(target).to.be.an('object').and.to.have.property('_id');
    expect(target.id()).to.be.equal(config.document + '_copy');
  }
}, {
  'message': 'info about the document',
  'callpath': 'document.info',
  'callback': function(error, info) {
    expect(info).to.be.an('object')
    expect(info).to.have.property('revision')
    expect(info).to.have.property('size');
  }
}, {
  'message': 'save attachment',
  'callpath': 'document.saveAttachment',
  'arguments': [__dirname + '/../Makefile', 'text/plain'],
  'callback': function(error, confirmed) {
    expect(confirmed).to.be.true;
  }
}, {
  'message': 'save attachment with custom name',
  'callpath': 'document.saveAttachment',
  'arguments': [__dirname + '/../Makefile', 'text/plain', config.attachment],
  'callback': function(error, confirmed) {
    expect(confirmed).to.be.true;
  }
}, {
  'message': 'load attachment',
  'callpath': 'document.getAttachment',
  'arguments': [config.attachment],
  'callback': function(error, attachment) {
    expect(attachment).to.be.a('string');
  }
}, {
  'message': 'delete attachment',
  'callpath': 'document.deleteAttachment',
  'arguments': ['Makefile'],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'delete document with custom name',
  'callpath': 'document.deleteAttachment',
  'arguments': [config.attachment],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'delete document',
  'callpath': 'document.destroy',
  'callback': function(error, document) {
    expect(document).to.be.an('object').and.to.have.property('_id');
  }
}];
