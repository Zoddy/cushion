nodecouch
=========

nodejs couchdb adapter


create new connection
---------------------
``` js
var nodecouch = new (require('nodecouch').Connection)(
                  '127.0.0.1', // host
                  5984, // port
                  'foo', // username
                  'bar' // password
                );
```
