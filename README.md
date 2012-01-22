nodecouch
=========

Node.js CouchDB Interface


connection api
==============

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

create database
---------------
``` js
nodecouch.createDatabase('foo', function(error, response) {
  console.log(error || response);
});
```

get a list of databases
-----------------------
``` js
// the second (boolean) argument can be set to true (default false), if you want
// to filter the couchdb related databases (e.g. _user)
nodecouch.listDatabases(function(error, databases) {
  console.log(error || databases);
}, true);
```

delete database
---------------
``` js
nodecouch.deleteDatabase('foo', function(error, response) {
  console.log(error || response);
});
```

get version of couchdb
----------------------
``` js
nodecouch.getVersion(function(error, version) {
  console.log(error || version);
});
```

make a lowlevel request
-----------------------
``` js
nodecouch.request(
  'GET' // http method GET, PUT, POST or DELETE
  'test/_design/foo/_view/bar' // complete path after the uri
  function(error, response) { // and finally the callback
    console.log(error || response);
  }
);
```


database api
============

connect to a specific database
------------------------------
``` js
var nodecouch = new (require('nodecouch').Connection)(
                  '127.0.0.1', // host
                  5984, // port
                  'foo', // username
                  'bar' // password
                ),
    db = nodecouch.database('foo'); // returns the database api object
```

get informations about the database
-----------------------------------
``` js
db.getInfo(function(error, info) {
  console.log(error || info);
});
```

get a specific document
-----------------------
``` js
db.get('foo', function(error, document) {
  console.log(error || document);
});
```

retrieving a view
-----------------
``` js
db.view(
  'foo', // design document, after the "_design/"
  'bar', // view map name
  function(error, result) {
    console.log(error || result);
  }
);
```
