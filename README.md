nodecouch
=========

Node.js CouchDB API


connection api
--------------

### create new connection ###

**Description:** Creates a new connection to a CouchDB.

	nodecouch.Connection(host, port, username, password);

**host** - host of couchdb instance **[ default: '127.0.0.1' ]**  
**port** - port of couchdb instance **[ default: 5984 ]**  
**username** - name of couchdb user **[ default: '' ]**  
**password** - password for given couchdb user **[ default: '']**

**Example:**

	var nodecouch = new (require('nodecouch').Connection)(
                      '127.0.0.1', // host
                      5984, // port
                      'foo', // username
                      'bar' // password
                    );


### get a list of databases ###

**Description:** Get an array of database objects.

	dbs = nodecouch.listDatabases(callback [, noCouchRelated]);

**callback** - callback function(error, response) for error and response handling  
**noCouchRelated** - list all databases or only not couchdb related databases **[ default: false ]**

**Example:**

	// getting all databases (couchdb databases included like "_users" or "_replicator")
	nodecouch.listDatabases(function(error, response) {
      console.log(error || response);
	});

	// getting no couchdb related databases
	// (couchdb databases excluded like "_users" or "_replicator")
	nodecouch.listDatabases(function(error, response) {
      console.log(error || response);
	}, true);


### get version of couchdb ###

**Description:** Get version of connected couchdb.

	nodecouch.version(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	nodecouch.version(function(error, version) {
      console.log(error || version);
	});


### make a low level request ###
**Description:** If there is something nodecouch doesn't offer to you, make a low level request to couchdb.

	nodecouch.request(properties);

**properties.method** - HTTP method, can be GET, PUT, POST, DELETE, HEAD, COPY **[ default: 'GET' ]**  
**properties.path** - uri path after domain  **[ default: '']**  
**properties.headers** - key/value-pairs of additional http headers  
**properties.body** - additional request body  
**properties.callback** - callback function(error, response) for error and response handling

**Example:**

	// getting all documents of given database
	nodecouch.request({
      'method': 'GET',
      'path': 'foodb/_all_docs',
      'callback': function(error, response) {
        console.log(error || response);
      }
	});

	// creating a new document
	nodecouch.request({
      'method': 'PUT',
      'path': 'foodb/foodoc',
      'body': {
        'name': 'John Doe'
      },
      'callback': function(error, response) {
        console.log(error || response);
      }
	});


database api
------------

### connect to a specific database ###

**Description:** Connect to a given database.

    nodecouch.database(name);

**name:** name of the database

**Example:**

    var db = nodecouch.database('foodb');


### check if database exists ###

**Description:** Checks if the database exists.

	db.exists(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	db.exists(function(error, exist) {
      console.log(error || exist);
	});


### create database ###

**Description:** Create database.

	db.create(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	db.create(function(error, response) {
      console.log(error || response);
	});


### delete database ###

**Description:** Delete database.

	db.destroy(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	db.destroy(function(error, response) {
      console.log(error || response);
	});


### get informations about the database ###

**Description:** Get whole information about the database.

	db.info(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	db.info(function(error, info) {
	  console.log(error || info);
	});


### get name of the database ###

**Description:** Get name of the database.

**Example:**

	var dbName = db.name();


### get all documents ###

**Description:** The additional options that you can set as first parameter, are the same that you can set at the view function, because the getAll function retrieves a special view at the couchdb `_all_docs`.

	db.getAll(callback)
    db.getAll(params, callback);

**params** - query parameter (see description) or callback function(error, response) for error and response handling  
**callback** - callback function(error, response) for error and response handling

**Example:**

    db.getAll(function(error, allDocs) {
      console.log(error || allDocs);
    });


### retrieving a view ###

    db.view(designDocument, viewFuntion, callback)
    db.view(designDocument, viewFunction, params, callback)

**designDocument** - name of the design document after the "_design/"  
**viewFunction** - name of the view function  
**params** - additional query params, this are all the query parameters that are documented at the couchdb view api http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options  
**callback** - callback function(error, response) for error and response handling

    db.view(
      'foo',
      'bar',
      function(error, result) {
        console.log(error || result);
      }
    );

**Example (skip first five documents and limits the result to ten):**

    db.view(
      'foo',
      'bar',
      {'skip': 5, 'limit': 10},
      function(error, result) {
        console.log(error || result);
      },
    );


### retrieving a list ###

    db.list(design, list, view, callback)
    db.list(design, list, view, params, callback)
    db.list(design, list, otherDesign, view, callback)
    db.list(design, list, otherDesign, view, params, callback)

**design** - name of the design document without the "_design/"  
**list** - name of the list function  
**otherDesign** - name of another design document without the "_design/"  
**view** - name of the function  
**params** - additional params, the same that you can set at the view requests  
**callback** - callback function(error, response) for error and response handling

**Example:**

    db.list(
      'fooDesign',
      'fooList',
      'fooView',
      {'skip': 5, 'limit': 10},
      function(error, result) {
      	console.log(error || result);
      }
    );


document api
------------

### getting document object ###

**With given ID** `var doc = db.document('foo' [, revision]);`  
**Without ID if you want to create it later from the CouchDB** `var doc = db.document();`


### create document ###
**Description:** Creates the document, if you don't set the id before, the couchdb will create it and nodecouch set's it in the document object

    doc.create(body, callback)

**body** - json body for the document  
**callback** - callback function(error, document) for error and response handling


### load document ###

    doc.load(callback)

**callback** - callback function(error, document) for error and response handling


### save document ###

    doc.save(body, callback)

**body** - json body for the document  
**callback** - callback function(error, document) for error and response handling


### copy document ###

    doc.copy(targetID, callback)
    doc.copy(targetID, targetRevision, callback)

**targetID** - id of the target document  
**targetRevision** - revision of the target document  
**callback** - callback function(error, sourceDocument, targetDocument) for error and response handling


### delete document ###

    doc.destroy(callback)

**callback** - callback function(error, document) for error and response handling


## running tests

To run the test suite first invoke the following command within the repo, installing the development dependencies:

    $ npm install

then run the tests:

    $ make test


## License

(The MIT License)

Copyright (c) 2009-2011 André Kussmann <zoddy@zoddy.de>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.