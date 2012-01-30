#!/usr/bin/node


var nodecouch = new (require('../nodecouch.js').Connection)(
                  'localhost',
                  5984,
                  'zoddy',
                  'zoddy'
                ),
    db = nodecouch.database('nctest'),
    doc = db.document('foobar'),
    callback = function(error, response) {
                 console.log(
                   (error) ? 'error:' : 'response:',
                   error || response
                 );
               };

//nodecouch.getVersion(callback);
//nodecouch.listDatabases(callback);
//db.exists(callback);
//db.create(callback);
//db.info(callback);
//db.delete(callback);
//doc.create({'foo': 'bar'}, callback);
//doc.load(callback);
//doc.delete(callback);
/*doc.copy('barbaz', function(error, source, target) {
  if (error) {
    console.log('error:', error);
  } else {
    console.log('response:', source, target);
  }
});*/
//doc.info(callback);