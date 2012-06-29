/**
 * Connection tests
 *
 * 1) get version
 * 2) get complete config
 * 3) get section config
 * 4) get option config
 * 5) set option to new value
 * 6) creating a database object
 * 7) getting list of databases
 */

var assert = require('assert'),
    check = require('./check.js')
    mockup = function(properties) {
               properties.callback(properties, null);
             },
    cushion = new (require('../cushion.js').Connection)(
                'localtest',
                '5984',
                'foo',
                'bar'
              );


// overwrite original request function
cushion.request = mockup;


// starting tests
describe('connection', function() {
  describe('get version', function() {
    it('should return a version string', function(done) {
      cushion.version(function(properties) {
        check(properties, 'GET', '');

        done();
      });
    });
  });

  describe('get complete config', function() {
    it('should return complete config', function(done) {
      cushion.config(function(properties) {
        check(properties, 'GET', '_config');

        done();
      });
    });
  });

  describe('get section config', function() {
    it('should return config of a section', function(done) {
      cushion.config('foosection', function(properties) {
        check(properties, 'GET', '_config/foosection');

        done();
      });
    });
  });

  describe('get option config', function() {
    it('should return config of an option', function(done) {
      cushion.config('foosection', 'foooption', function(properties) {
        check(properties, 'GET', '_config/foosection/foooption');

        done();
      });
    });
  });

  describe('set option to new value', function() {
    it('should confirm the save', function(done) {
      cushion.config('foosection', 'foooption', 'foobar', function(properties) {
        check(properties, 'PUT', '_config/foosection/foooption', '"foobar"');

        done();
      });
    });
  });

  describe('create a database object', function() {
    it('should return a new database object', function() {
      var database = cushion.database('foo');

      assert.strictEqual(typeof(database), 'object', 'have to be an object');
      assert.strictEqual(database._name, 'foo', 'db name have to be "foo"');
    });
  });

  describe('get a list of databases', function() {
    it('should return an array with database objects', function(done) {
      cushion.listDatabases(function(properties) {
        check(properties, 'GET', '_all_dbs');

        done();
      });
    });
  });
});
