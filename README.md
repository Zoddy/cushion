nodecouch
=========

Node.js CouchDB Interface


connection api
--------------

### create new connection ###

``` js
var nodecouch = new (require('nodecouch').Connection)(
                  '127.0.0.1', // host
                  5984, // port
                  'foo', // username
                  'bar' // password
                );
```

### error handling ###

you can choose between two error handlings. if you set a fifth argument at a new
connection object, you can switch between them.

set to `true` means, that in the error object at each callback there are also
couchdb errors

set to `false` means, that only connection errors (e.g. wrong port) are written
in the error object, couchdb errors will be hold in the response object
"true" is the default entry

### create database ###

``` js
nodecouch.createDatabase('foo', function(error, response) {
  console.log(error || response);
});
```

### get a list of databases ###

``` js
// the second (boolean) argument can be set to true (default false), if you want
// to filter the couchdb related databases (e.g. _user)
nodecouch.listDatabases(function(error, databases) {
  console.log(error || databases);
}, true);
```

### delete database ###

``` js
nodecouch.deleteDatabase('foo', function(error, response) {
  console.log(error || response);
});
```

### get version of couchdb ###

``` js
nodecouch.getVersion(function(error, version) {
  console.log(error || version);
});
```

### make a lowlevel request ###

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
------------

### connect to a specific database ###

``` js
var nodecouch = new (require('nodecouch').Connection)(
                  '127.0.0.1', // host
                  5984, // port
                  'foo', // username
                  'bar' // password
                ),
    db = nodecouch.database('foo'); // returns the database api object
```

### get informations about the database ###

``` js
db.getInfo(function(error, info) {
  console.log(error || info);
});
```

### get a specific document ###

current revision

``` js
db.get('foo', function(error, document) {
  console.log(error || document);
});
```

specific revision

``` js
db.get('foo', '2-8157185549b948cc544f5574f073240b', function(error, document) {
  console.log(error || document);
});
```

### create document ###

create a document, which id will be created by couchdb

``` js
db.createDocument(
  {'foo': 'bar'}, // document body
  function(error, confirmation) { // callback
    console.log(error || confirmation);
  }
);
```

create a document with a user generated document id

``` js
db.createDocument(
  'foobar', // document id
  {'foo': 'bar'}, // document body
  function (error, confirmation) { // callback
    console.log(error || confirmation);
  }
);

### retrieving a view ###

``` js
db.view(
  'foo', // design document, after the "_design/"
  'bar', // view map name
  function(error, result) {
    console.log(error || result);
  }
);
```

you can set a fourth argument, which sets up additional arguments to the views.
this are all the query parameters that are documented at the couchdb view api
http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options

This skips the first five documents and limits the output to 10 results.

``` js
db.view(
  'foo',
  'bar',
  function(error, result) {
    console.log(error || result);
  },
  {skip: 5, limit: 10}
);
```
