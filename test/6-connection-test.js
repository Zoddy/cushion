// jshint settings
/*global exports: false, require: false*/

/**
 * 1) restart server
 */

var expect = require('chai').expect;

exports.tests = [{
  'message': 'restart server',
  'callpath': 'connection.restart',
  'url': ['POST', '_restart'],
  'callback': function(error, restarted) {
    expect(restarted).to.be.true;
  }
}];
