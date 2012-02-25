/**
 * Database tests
 *
 * 1)  getting the name
 * 2)  check for existing
 * 3)  create database
 * 4)  getting info
 * 5)  getting all documents
 * 6)  request a view
 * 7)  request a view with some query params
 * 8)  request a list
 * 9)  request a list with some query params
 * 10) request a list with view in another design document
 * 11) request a list with view in another design document and some query params
 * 12) delete the database
 */

var check = require('./check.js'),
    mockup = function(properties) {
               properties.callback(properties, null);
             },
    nodecouch = new (require('../nodecouch.js').Connection)(
                  'localtest',
                  '5984',
                  'foo',
                  'bar'
                ),
    database = nodecouch.database('foo');


// overwrite original request function
nodecouch.request = mockup;


// starting tests
describe('database', function() {
  describe('checking if database exists', function() {
    it('should return a validation for existing', function(done) {
      database.exists(function(properties) {
        check(properties, 'GET', 'foo');

        done();
      });
    });
  });

  describe('create the database', function() {
    it('should creating the database', function(done) {
      database.create(function(properties) {
        check(properties, 'PUT', 'foo');

        done();
      });
    });
  });

  describe('getting infos about the database', function() {
    it('should return an info object', function(done) {
      database.exists(function(properties) {
        check(properties, 'GET', 'foo');

        done();
      });
    });
  });

  describe('request all documents', function() {
    it('should return an array with id\'s and rev\'s', function(done) {
      database.allDocuments(function(properties) {
        check(properties, 'GET', 'foo/_all_docs');

        done();
      });
    });
  });

  describe('request a view', function() {
    it('should return a key-value-pair-object', function(done) {
      database.view('foo', 'bar', function(properties) {
        check(properties, 'GET', 'foo/_design/foo/_view/bar');

        done();
      });
    });
  });

  describe('request a view with some query params', function() {
    it('should return a key-value-object', function(done) {
      database.view(
        'foo',
        'bar',
        {'skip': 5, 'limit': 10},
        function(properties) {
          check(properties, 'GET', 'foo/_design/foo/_view/bar?skip=5&limit=10');

          done();
        }
      );
    });
  });

  describe('request a list', function() {
    it('should return a response from it', function(done) {
      database.list('foo', 'bar', 'foobar', function(properties) {
        check(properties, 'GET', 'foo/_design/foo/_list/bar/foobar');

        done();
      });
    });
  });

  describe('request a list with some query params', function() {
    it('should return a response from it', function(done) {
      database.list(
        'foo',
        'bar',
        'foobar',
        {'skip': 5, 'limit': 10},
        function(properties) {
          check(
            properties,
            'GET',
            'foo/_design/foo/_list/bar/foobar?skip=5&limit=10'
          );

          done();
        }
      );
    });
  });

  describe('request a list with view in another design document', function() {
    it('should return a response from it', function(done) {
      database.list('foo', 'bar', 'foobar', 'baz', function(properties) {
        check(properties, 'GET', 'foo/_design/foo/_list/bar/foobar/baz');

        done();
      });
    });
  });

  describe(
    'request a list with view in another design document and some query params',
    function() {
      it('should return a response from it', function(done) {
        database.list(
          'foo',
          'bar',
          'foobar',
          'baz',
          {'skip': 5, 'limit': 10},
          function(properties) {
            check(
              properties,
              'GET',
              'foo/_design/foo/_list/bar/foobar/baz?skip=5&limit=10'
            );

            done();
          }
        );
      });
    }
  );

  describe('delete the database', function() {
    it('should validate the request', function(done) {
      database.destroy(function(properties) {
        check(properties, 'DELETE', 'foo');

        done();
      });
    });
  });
});
