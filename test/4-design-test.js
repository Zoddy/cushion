// jshint settings
/*global exports: false, require: false*/

/**
 * 1) save design document
 * 2) starting compaction
 */

var expect = require('chai').expect;

exports.tests = [{
  'message': 'save design document',
  'callpath': 'design.save',
  'callback': function(error, document) {
    expect(document).to.be.an('object').and.to.respondTo('view');
  }
}, {
  'message': 'starting compaction',
  'callpath': 'design.compact',
  'callback': function(error, started) {
    expect(started).to.be.true;
  }
}];