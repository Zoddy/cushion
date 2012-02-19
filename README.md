nodecouch
=========

Node.js CouchDB Interface


connection api
--------------

### create new connection ###

***Description:*** Creates a new connection to couched instance.

	nodecouch.Connection(host, port, username, password);

**host** - host of couchdb instance **[ default: '127.0.0.1' ]**  
**port** - port of couchdb instance **[ default: 5984 ]**  
**username** - name of couchdb user **[ default: '' ]**  
**password** - password for given couchdb user **[ default: '']**  

***Example:***

	var nodecouch = new (require('nodecouch').Connection)(
                  '127.0.0.1', // host
                  5984, // port
                  'foo', // username
                  'bar' // password
                );


### get database ###

***Description:*** Get a new database object.  

	nodecouch.database(name);

**name** - name of particular database  

***Example:***

	db = nodecouch.database('database');


### get a list of databases ###

***Description:*** Get an array of database objects.

	dbs = nodecouch.listDatabases(callback [, noCouchRelated]);

**callback** - callback function(error, response) for error and response handling   
**noCouchRelated** - list all databases or only not couched related databases **[ default: false ]**

***Example:***

	//getting all databases ('_users' & '_replicator' included)
	nodecouch.lostDatabases(function(error, response) {
		// if error occurred, show it
		console.log(error || response);
	});

	//getting no couched related databases ('_users' & '_replicator' excluded)
	nodecouch.lostDatabases(function(error, response) {
		// if error occurred, show it
		console.log(error || response);
	}, true);

### get version of couchdb ###

**Description:** Get version of connected couchdb.
	nodecouch.version(callback(error, version));

**callback** - callback function(error, response) for error and response handling  

**Example:**
	nodecouch.version(function(error, version) {
		// if error occurred, show it
  		console.log(error || version);
	});


### make a low level request ###
***Description:*** If there is something nodecouch doesn't offer to you, make a low level request to couchdb.
	nodecouch.request(properties);

**properties.method** - HTTP method, can be GET, PUT, POST, DELETE, HEAD, COPY **[ default: 'GET' ]**  
**properties.path** - uri path after domain  **[ default: '']**  
**properties.headers** - key/value-pairs of additional http headers  
**properties.body** - additional request body  
**properties.callback** - callback function(error, response) for error and response handling

**Example:**

	//getting all documents of given database
	nodecouch.request({
		'method': 'GET',
		'path': 'someDB/_all_docs',
		'callback': function(err, resp) {
			console.log(err || resp);
		}
	});

	//creating a new document
	nodecouch.request({
		'method': 'PUT', 
		'path': 'someDB/docID', 
		'body': {
			'name': 'John Doe'
		},
		'callback': function(err, resp){
			console.log(err || resp);
		}
	});


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

### get all documents ###

As second parameter you can add additional options, the same that you can set at
the view function, because the getAll function retrieves a special view at the
couchdb: `_all_docs`.

``` js
db.getAll(function(error, allDocs) {
  console.log(error || allDocs);
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
```

### update document ###

``` js
db.updateDocument(
  'foobar', // document id
  '3-1c26eb9bb45a9cf6991ddc900f5f5508', // revision
  {'bar': 'foo'}, // new body
  function(error, confirmation) { // callback
    console.log(error || confirmation);
  }
);
```

### copy document ###

``` js
db.copyDocument(
  'foo', // source document id
  'bar', // target document id
  function(error, confirmation) { // callback
    console.log(error || confirmation);
  }
);
```

you can also copy a specific revision and if the target currently exists, you
have to specify the target revision

``` js
db.copyDocument(
  {id: 'foo', revision: '1-4c6114c65e295552ab1019e2b046b10e'}, // source
  {id: 'bar', revision: '3-1c26eb9bb45a9cf6991ddc900f5f5508'}, // target
  function(error, confirmation) { // callback
    console.log(error || confirmation);
  }
);
```

### delete document ###

``` js
db.deleteDocument(
  'foobar', // document id
  '1-4c6114c65e295552ab1019e2b046b10e', // revision
  function(error, confirmation) { //callback
    console.log(error || confirmation);
  }
);
```

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
