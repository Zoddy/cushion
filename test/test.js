#!/usr/bin/node


var nodecouch = new (require('../nodecouch.js').Connection)(
                  'localhost',
                  5984,
                  'zoddy',
                  'zoddy'
                ),
    db = nodecouch.database('nctest'),
    doc = db.document('foobar'),
    callback = function() {
                 var args = Array.prototype.slice.call(arguments);

                 args.forEach(function(content) {
                   console.log(content);
                 });
               };

//nodecouch.version(callback);
//nodecouch.listDatabases(callback);
//nodecouch.listDatabases(callback, true);
//db.exists(callback);
//db.create(callback);
//db.info(callback);
//db.allDocuments(callback);
//db.view('test', 'all', {'limit': 1}, callback);
//db.view('test', 'all', {'skip': 1}, callback);
//db.view('test', 'all', {'key': '"barbaz"'}, callback);
//db.list('test', 'toxml', 'all', callback);
//db.list('test', 'toxml', 'all', {'key': '"foobar"'}, callback);
//db.list('test', 'toxml', 'test2', 'all', callback);
//db.list('test', 'toxml', 'test2', 'all', {'key': '"foobar"'}, callback);
//db.delete(callback);
//doc.create({'foo': 'bar'}, callback);
//doc.load(callback);
/*doc.load(function(error, document) {
  console.log(document.body());
});*/
//doc.delete(callback);
/*doc.copy('barbaz', function(error, source, target) {
  if (error) {
    console.log('error:', error);
  } else {
    console.log('response:', source, target);
  }
});*/
/*doc.load(function(error, response) {
  if (error !== null) {
    callback(error, null);
  } else {
    doc.save({'bar': 'baz'}, callback);
  }
});*/
//doc.info(callback);
