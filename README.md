![cushion logo](https://github.com/downloads/Zoddy/cushion/cushion-page-logo.png)

cushion
=========

Node.js CouchDB API

connection api
--------------

### create new connection ###

**Description:** Creates a new connection to a CouchDB.

	cushion.Connection();
	cushion.Connection(host);
	cushion.Connection(host, port);
	cushion.Connection(host, port, username);
	cushion.Connection(host, port, username, password);
	cushion.Connection(host, port, username, password, additional);

**host** - host of couchdb instance **[ default: '127.0.0.1' ]**
**port** - port of couchdb instance **[ default: 5984 ]**
**username** - name of couchdb user **[ default: '' ]**
**password** - password for given couchdb user **[ default: '' ]**
**additional** - additional options **[ default: {}]**
**additional.secure** - set to true, if you want to use https requests **[ default: false ]**

**Example:**

	var cushion = new (require('cushion').Connection)(
                    '127.0.0.1', // host
                    5984, // port
                    'foo', // username
                    'bar' // password
                  );


### get a list of databases ###

**Description:** Get an array of database objects.

	cushion.listDatabases(callback)
	cushion.listDatabases(noCouchRelated, callback)

**noCouchRelated** - if you set this to true, you will only get databases, which are user generated (it simply filters all databases that name begins with '_')
**callback** - callback function(error, response) for error and response handling

**Example:**

	// getting all databases (couchdb databases included like "_users" or "_replicator")
	cushion.listDatabases(function(error, response) {
      console.log(error || response);
	});

	// getting no couchdb related databases
	// (couchdb databases excluded like "_users" or "_replicator")
	cushion.listDatabases(true, function(error, response) {
      console.log(error || response);
	});


### get version of couchdb ###
**Description:** Get version of connected couchdb.

	cushion.version(callback);

**callback** - callback function(error, response) for error and response handling

**Example:**

	cushion.version(function(error, version) {
      console.log(error || version);
	});


### configuration ###
**Description:** Get or set configuration params. If you set:

* one param: you will get the complete configuration
* two params: you will get all options of the specific section
* three params: you will get the content of the specific option
* four params: you set a specific option to the new value, or you delete the given option, if you set value to null

```
cushion.config(callback)
cushion.config(section, callback)
cushion.config(section, option, callback)
cushion.config(section, option, value, callback)
```

**section** - name of a section (a group of options)
**option** - name of an option
**value** - new value for the option: if you set value to null, given option will be deleted
**callback** - function(error, section**|**option**|**saved) that will be called after getting the informations, or if new value was saved, or if there was an error


### create admin account ###
**Description:** Creates an admin account. That means the config param will be set and the user document created.

	cushion.createAdmin(name, password, callback);

**name** - name of the admin account
**password** - password of the admin account
**callback** - function(error, created) that will be called after creating the admin account, or if there was an error


### delete admin account ###
**Description:** Deletes the admin option at the configuration and the user document.

	cushion.deleteAdmin(name, callback);

**name** - name of the admin account
**callback** - function(error, deleted) that will be called after deleting the admin account, or if there was an error


### list of active tasks ###
**Description:** Returns a list of active tasks.

	cushion.activeTasks(callback);

**callback** - function(error, activeTasks) that will called, after getting the list of active tasks or if there was an error


### list of generated uuids ###
**Description:** Returns a list of couchdb generated uuids.

	cushion.uuidList(callback);
	cushion.uuidList(count, callback);

**count** - number of uuids to generate **[ default: 1 ]**
**callback** - function(error, uuidList) that will be called, after getting the list of uuids or if there was an error


### server statistics ###
**Description:** Returns server statistics.

	cushion.stats(callback);

**callback** - function(error, stats) that will be called, after getting the statistics of if there was an error


### get log ###
**Description:** Returns the tail of the server's log file. There's also another param `offset` for the request to the couchdb, but it's not useful, look at the documentation http://wiki.apache.org/couchdb/HttpGetLog.

	cushion.log(callback);
	cushion.log(bytes, callback);

**bytes** - number of bytes which do you want from the tail **[ default: 1000 ]**
**callback** - function(error, log) that will be called, after getting the log or if there was an error


### restart server ###
**Description:** Restarts the server.

	cushion.restart(callback);

**callback** - function(error, restart) function that will be called, after initializing the restart or if there was an error


### make a low level request ###
**Description:** If there is something cushion doesn't offer to you, make a low level request to couchdb.

	cushion.request(properties);

**properties.method** - HTTP method, can be GET, PUT, POST, DELETE, HEAD, COPY **[ default: 'GET' ]**
**properties.path** - uri path after domain  **[ default: '']**
**properties.headers** - key/value-pairs of additional http headers
**properties.body** - additional request body
**properties.callback** - callback function(error, response, headers) for error and response handling

**Example:**

	// getting all documents of given database
	cushion.request({
      'method': 'GET',
      'path': 'foodb/_all_docs',
      'callback': function(error, response, headers) {
        console.log(error || response);
      }
	});

	// creating a new document
	cushion.request({
      'method': 'PUT',
      'path': 'foodb/foodoc',
      'body': {
        'name': 'John Doe'
      },
      'callback': function(error, response, headers) {
        console.log(error || response);
      }
	});


database api
------------

### connect to a specific database ###

**Description:** Connect to a given database.

    cushion.database(name);

**name:** name of the database

**Example:**

    var db = cushion.database('foodb');


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

    db.view(designDocument, viewFunction, callback)
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


### compaction ###

	db.compact(callback)

**callback** - function(error, started) that will be called, after compaction was started or if there was an error


### cleanup ###

	db.cleanup(callback)

**callback** - function(error, started) that will be called, after cleanup was started or if there was an error


document api
------------

### getting document object ###
**Description:** If you set the ID and it will begin with `_design/`, then you will get a design document object instead of a normal document. Design documents have the same API as normal document plus some extra functions (look at `design document api`).

**With given ID** `var doc = db.document('foo' [, revision]);`
**Without ID** (if you want to create it later from the CouchDB) `var doc = db.document();`


### create document ###
**Description:** Creates the document, if you don't set the id before, the couchdb will create it and cushion set's it in the document object

    doc.create(body, callback)

**body** - json body for the document
**callback** - callback function(error, document) for error and response handling


### load document ###

    doc.load(callback)

**callback** - callback function(error, document) for error and response handling

### set content ###
**Description:** If you only set one argument, you get the content of the object of that name. If you set 2 or more (you can set how much do you want) it will work as setter.

	doc.body(obj)
	doc.body(obj, content)
	doc.body(parent, child, content)

**obj** - name of the object
**content** - new content for **obj**
**child** - child object of **obj**

####Some examples:####

	doc.body('foo', 'bar'); // foo = 'bar'
	doc.body('foo', 'bar', 'baz'); // foo.bar = 'baz';
	doc.body('foo', 'bar', 'baz', 'foobar'); // foo.bar.baz = 'foobar';


### save document ###

    doc.save(callback)

**callback** - callback function(error, document) for error and response handling


### get info ###
**Description:** Gets some info from the document: revision and size of the document.

	doc.info(callback)

**callback** - callback function that will called, after retrieving information, or if there was an error


### copy document ###

    doc.copy(targetID, callback)
    doc.copy(targetID, targetRevision, callback)

**targetID** - id of the target document
**targetRevision** - revision of the target document
**callback** - callback function(error, sourceDocument, targetDocument) for error and response handling


### delete document ###

    doc.destroy(callback)

**callback** - callback function(error, document) for error and response handling


attachment api
--------------

### save attachment ###
**Description:** Files will always opened as UTF-8.

	doc.saveAttachment(file, contentType, callback)
	doc.saveAttachment(file, contentType, name, callback)

**file** - file descriptor object from nodes fs library
**contentType** - content type of the file (like `image/png`)
**name** - name of the file it will have at the document. if you don't set it by yourself, cushion will use the filename instead
**callback** - function that will be called, after saving the attachment


### get attachment ###

	doc.getAttachment(name, callback)

**name** - attachment name in the document
**callback** - function that will be called, after the attachment was loaded


### delete attachment ###

	doc.deleteAttachment(name, callback)

**name** - attachment name in the document
**callback** - function that will be called, after the attachment was deleted


design document api
-------------------

### get, create or update views ###
**Description:** If you only set one argument, you will get the object with the string representation of the map and reduce functions. If you set `map` and `reduce`, you will set a view. If there is no views object in the body, it will be created, so you don't have to create it by yourself.

	design.view(name)
	design.view(name, map)
	design.view(name, map, reduce)

**name** - name of the view
**map** - string representation of the map function
**reduce** - string representation of the reduce function


### get, create or update lists ###
**Description:** If you only set one argument, you will get the string representation of the list function. If you set the `content`, it will save to the list. If there is no lists object in the body, it will be created, so you don't have to create it by yourself.

	design.list(name)
	design.list(name, content)

**name** - name of the list
**content** - string representation of the list function


### get, create or update shows ###
**Description:** If you only set one argument, you will get the string representation of the show function. If you set the `content`, it will save to the show. If there is no shows object in the body, it will be created, so you don't have to create it by yourself.

	design.show(name)
	design.show(name, content)

**name** - name of the show
**content** - string representation of the show function


### compaction ###

	design.compact(callback)

**callback** - function(error, started) that will be called, after compaction was started or if there was an error


running tests
-------------

To run the test suite first invoke the following command within the repo, installing the development dependencies:

	$ npm install

then run the tests:

    $ make test


upcoming features
-----------------

* user management
* bulk updates
* query params api


License
-------

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