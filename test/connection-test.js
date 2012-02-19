/**
 * Connection tests
 *
 * 1) check version
 * 2) creating a database object
 * 3) getting list of databases
 */

var assert = require('assert'),
    check = require('./check.js')
    mockup = function(properties) {
               properties.callback(properties, null);
             },
    nodecouch = new (require('../nodecouch.js').Connection)(
                  'localtest',
                  '5984',
                  'foo',
                  'bar'
                );


// overwrite original request function
nodecouch.request = mockup;


// starting tests
describe('connection', function() {
  describe('get version', function() {
    it('should return a version string', function(done) {
      nodecouch.version(function(properties) {
        check(properties, 'GET', '');

        done();
      });
    });
  });

  describe('create a database object', function() {
    it('should return a new database object', function() {
      var database = nodecouch.database('foo');

      assert.strictEqual(typeof(database), 'object', 'have to be an object');
      assert.strictEqual(database._name, 'foo', 'db name have to be "foo"');
    });
  });

  describe('get a list of databases', function() {
    it('should return an array with database objects', function(done) {
      nodecouch.listDatabases(function(properties) {
        check(properties, 'GET', '_all_dbs');

        done();
      });
    });
  });
});
