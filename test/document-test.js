/**
 * Document tests
 *
 * 1) create document with given id
 * 2) create document without id
 * 3) load document
 * 4) copy document
 * 5) save document
 * 6) delete document
 * 7) save attachment TODO
 * 8) save attachment with custom name TODO
 * 9) load attachment TODO
 */

var check = require('./check.js'),
    mockup = function(properties) {
               properties.callback(properties, null);
             },
    cushion = new (require('../cushion.js').Connection)(
                  'localtest',
                  '5984',
                  'foo',
                  'bar'
                ),
    database = cushion.database('foodb'),
    docWithId = database.document('foodoc'),
    docWithoutId = database.document();


// overwrite original request function
cushion.request = mockup;


// starting tests
describe('document', function() {
  describe('create document with given id', function() {
    it('should create the document', function(done) {
      docWithId.create({'foo': 'bar'}, function(properties) {
        check(properties, 'PUT', 'foodb/foodoc', {'foo': 'bar'});

        done();
      });
    });
  });

  describe('create document without id', function() {
    it('should create the document and returns generated id', function(done) {
      docWithoutId.create({'foo': 'bar'}, function(properties) {
        check(properties, 'POST', 'foodb', {'foo': 'bar'});

        done();
      });
    });
  });

  describe('load document', function() {
    it('should load the document body and revision', function(done) {
      docWithId.load(function(properties) {
        check(properties, 'GET', 'foodb/foodoc');

        done();
      });
    });
  });

  describe('copy document', function() {
    it('should copy the current document', function(done) {
      docWithId.copy('copyDoc', function(properties) {
        check(
          properties,
          'COPY',
          'foodb/foodoc',
          null,
          {'Destination': 'copyDoc'}
        );

        done();
      });
    });
  });

  describe('save document', function() {
    it('should validate the save', function(done) {
      docWithId._revision = 'foorev';
      docWithId.save({'foo': 'bar'}, function(properties) {
        check(
          properties,
          'PUT',
          'foodb/foodoc',
          {'foo': 'bar', '_rev': 'foorev'}
        );

        done();
      });
    });
  });

  describe('delete document', function() {
    it('should validate it', function(done) {
      docWithId.destroy(function(properties) {
        check(properties, 'DELETE', 'foodb/foodoc?rev=foorev');

        done();
      });
    });
  });

  describe('save attachment', function() {
    it('should save the attachment', function(done) {
      docWithId.saveAttachment(
        __dirname + '/../Makefile',
        'text/plain',
        function(properties) {
          check(properties, 'PUT', 'foodb/foodoc/Makefile?rev=foorev');

          done();
        }
      );
    });
  });

  describe('load attachment', function() {
    it('should load the attachment', function(done) {
      docWithId.getAttachment(
        'Makefile',
        function(properties) {
          check(properties, 'GET', 'foodb/foodoc/Makefile?rev=foorev');

          done();
        }
      );
    });
  });
});
