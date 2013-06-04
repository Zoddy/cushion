![cushion logo](https://github.com/downloads/Zoddy/cushion/cushion-page-logo.png)

cushion [![Build Status](https://secure.travis-ci.org/Zoddy/cushion.png?branch=master)](http://travis-ci.org/Zoddy/cushion) [![NPM version](https://badge.fury.io/js/cushion.png)](http://badge.fury.io/js/cushion)
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
**additional.path** - an additional path after ther host and port (e.g. you want to use a proxy) **[ default: '' ]**

**Example:**

	var cushion = new (require('cushion').Connection)(
                    '127.0.0.1', // host
                    5984, // port
                    'foo', // username
                    'bar' // password
                  );

### get or set option ###

**Description:** Get or set options.If you set:

* no param: you will get all options
* one param: you will get one particular option
* two params: you will set one particular option

```
cushion.option()
cushion.option(option)
cuhsion.option(option, value)
```

**option** - name of an option  
**value** - value of an option  

**Example:**

	var host = cushion.option('host');

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

	cushion.uuids(callback);
	cushion.uuids(count, callback);

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


user api
--------

### create new user ###
**Description** Creates a new user

	user.create(name, password, callback);
	user.create(name, password, roles, callback);

**name** - name of the user  
**password** - password of the user  
**roles** - list of role strings  
**callback** - function(error, created) that will be called after creating the user, or if there was an error

**Example**

	// create a new user
	var user = cushion.user();

	user.create('fooUser', 'fooPassword', function(error, created) {
	  console.log(error || created);
	});
	
	// create a new user with roles
	user.create(
	  'fooUser',
	  'fooPassword',
	  ['fooRole', 'barRole'],
	  function(error, created) {
	  	console.log(error || created);
	  }
	);


### add role ###
**Description** Adds one or more roles to the user

	user.addRole(name, role, callback);
	user.addRole(name, roles, callback);

**name** - name of the user  
**role** - role to add to the user  
**roles** - list of roles to add to the user  
**callback** - function(error, added) that will be called after adding the role(s), or if there was an error

**Example**

	// add one role
	user.addRole('fooUser', 'fooRole', function(error, added) {
	  console.log(error || added);
	});
	
	// add two roles
	user.addRole('fooUser', ['fooRole', 'barRole'], function(error, added) {
	  console.log(error || added);
	});


### get roles ###
**Description** Get list of roles from the user

	user.getRoles(name, callback);

**name** - name of the user  
**callback** - function(error, roles) that will be called after getting the the list of roles, or if there was an error


### delete role ###
**Description** Deletes one or more roles from the user

	user.deleteRole(name, role, callback);
	user.deleteRole(name, roles, callback);

**name** - name of the user  
**role** - role to delete from the user  
**roles** - list of roles to delete from the user  
**callback** - function(error, deleted) that will be called after deleting the role(s), or if there was an error

**Example**

	// delete one role
	user.deleteRole('fooUser', 'fooRole', function(error, deleted) {
	  console.log(error || deleted);
	});
	
	// delete two roles
	user.deleteRole('fooUser', ['fooRole', 'barRole'], function(error, deleted) {
	  console.log(error || deleted);
	});


### change password ###
**Description** Changes the password of an existing user

	user.password(name, password, callback);

**name** - name of the user  
**password** - password of the user  
**callback** - function(error, changed) that will be called after changing the password, or if there was an error


### delete user ###
**Description** Deletes an user

	user.delete(name, callback);
	
**name** - name of the user  
**callback** - function(error, deleted) that will be called after deleting the user, or if there was an error


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

**Description:** The additional options that you can set as first parameter, are the same that you can set at the view function, because the allDocuments function retrieves a special view at the couchdb `_all_docs`.

	db.allDocuments(callback)
    db.allDocuments(params, callback);

**params** - query parameter object (see description) or callback function(error, response) for error and response handling  
**callback** - callback function(error, response) for error and response handling

**Example:**

	// get all documents without parameters
    db.allDocuments(function(error, info, allDocs) {
      console.log(error || allDocs);
    });
    
    // get all documents with parameters
    var params = { limit: '3', starkey: '_design/entries' };
    
    db.allDocuments(params, function(error, info, allDocs) {
      console.log(error || allDocs);
    });


### retrieving a view ###

    db.view(designDocument, viewFunction, callback)
    db.view(designDocument, viewFunction, params, callback)

**designDocument** - name of the design document after the "_design/"  
**viewFunction** - name of the view function  
**params** - additional query params, this are all the query parameters that are documented at the [couchdb view api](http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options)  
**callback** - callback function(error, info, rows) for error and response handling

    db.view(
      'foo',
      'bar',
      function(error, info, rows) {
        console.log(error, info, rows);
      }
    );

**Example (skip first five documents and limits the result to ten):**

    db.view(
      'foo',
      'bar',
      {'skip': 5, 'limit': 10},
      function(error, info, rows) {
        console.log(error, info, rows);
      },
    );


### retrieving a temporary view ###
**Description:** Retrieves a temporary view on the database.

    db.temporaryView(map, callback);
    db.temporaryView(map, reduce, callback);
    db.temporaryView(map, params, callback);
    db.temporaryView(map, reduce, params, callback);

**map** - map function as a string and not as a function  
**reduce** - reduce function as a string and not as a function  
**params** - additional query params, this are all the query parameters that are documented at the [couchdb view api](http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options)  
**callback** - function(error, info, rows) that will be called, after getting the result or if there was an error

**Example**

    // only map function
    db.temporaryView(
      'function(doc) {emit(doc._id, doc);}',
      function(error, info, rows) {
        console.log(error, info, rows);
      }
    );
    
    // map function and params
    db.temporaryView(
      'function(doc) {emit(doc._id, doc);}',
      {'skip': 1, 'limit': 1}
      function(error, info, rows) {
        console.log(error, info, rows);
      }
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


### retrieving show ###

    db.show(design, show)
    db.show(design, show, params)
    db.show(design, show, documentId)
    db.show(design, show, documentId, params)

**design** - name of the design document without the "_design/"  
**show** - name of the show function  
**documentId** - id of the document, that will be set as param to the show function  
**params** - additional query params as key-value-pairs

**Example:**

    db.show(
      'fooDesign',
      'fooShow',
      'fooDocument',
      {'format': 'xml'},
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


### revision limit ###
**Description** Sets or gets the revision limit for documents (default is 1000).

    db.revisionLimit(callback);
    db.revisionLimit(limit, callback);

**limit** - number of the new limit  
**callback** - function(error, limitOrSaved) that will be called after setting the limit (you will get a true as second parameter) or after getting the current limit or if there was an error

**Example:**

    // get the current limit
    db.revisionLimit(function(error, limit) {
      console.log(error || limit);
    });
    
    // set the limit
    db.revision(1500, function(error, saved) {
      console.log(error || saved);
    });


### purging ###
**Description:** With this you can delete not only the document revision as itself, also the history will be removed. But be careful, purging can have bad side effects, so please look at the [CouchDB Purge Documentation](http://wiki.apache.org/couchdb/Purge_Documents). The second argument `purged` on the callback give you feedback, which document revision could be purged.

    db.purge(documents, callback);

**documents** - An object with keys that are the document id's and values that are arrays with revisions of the documents.  
**callback** - function(error, purged) that will be called, after calling the purge command on the couchdb or if there was an error

**Example:**

    db.purge(
	  {'foo': ['34-a663dff69f1c48a25a431e05c31f9c05']},
	  function(error, purged) {
	    console.log(error || purged);
	  }
    );


### ensure full commit ###
**Description:** Saves all uncommited stuff to the disk.

    db.ensureFullCommit(callback);

**callback** - function(error, success) that will be called, after successfully started the save operation, or if there was an error


document api
------------

### getting document object ###
**Description:** If you set the ID and it will begin with `_design/`, then you will get a design document object instead of a normal document. Design documents have the same API as normal document plus some extra functions (look at `design document api`).

**With given ID** `var doc = db.document('foo' [, revision]);`  
**Without ID** (if you want to create it later from the CouchDB) `var doc = db.document();`


### load document ###

    doc.load(callback)

**callback** - callback function(error, document) for error and response handling

### get / set content ###
**Description:** If you call `body` without arguments, you will retrieve the whole document content. If you only set one argument, and this argument is a string, you will set the complete body and overwrites all settings before. Otherwise you get the content of the given porperty. If you set 2 or more (you can set how much do you want) it will work as setter. If you set the body and the content argument (the last one) was explicitly set to 'undefined', the property will be deleted.

	doc.body()
	doc.body(obj)
	doc.body(obj, content)
	doc.body(parent, child, content)
	
**obj** - name of the object  
**content** - new content for **obj**  
**child** - child object of **obj**

####Some examples:####

	doc.body({'foo': 'bar', '456': 123}) // foo = 'bar'; 456 = '123';
	doc.body('foo', 'bar'); // foo = 'bar';
	doc.body('foo'); // -> 'bar'
	doc.body('foo', 'bar', 'baz'); // foo.bar = 'baz';
	doc.body('foo', 'bar', 'baz', 'foobar'); // foo.bar.baz = 'foobar';
	doc.body(); // foo.bar.baz = 'foobar'; 456 = '123';


### save document ###
**Description:** Saves the document, if document does not exist, it will be created.

    doc.save(callback)

**callback** - callback function(error, document) for error and response handling


### get info ###
**Description:** Gets some info from the document: revision and size of the document.

	doc.info(callback)
	
**callback** - callback function(error, info) that will called, after retrieving information, or if there was an error


### copy document ###

    doc.copy(targetID, callback)
    doc.copy(targetID, targetRevision, callback)

**targetID** - id of the target document  
**targetRevision** - revision of the target document  
**callback** - callback function(error, sourceDocument, targetDocument) for error and response handling


### delete document ###

    doc.destroy(callback)

**callback** - callback function(error, document) for error and response handling


### purging ###
**Description:** Look for more details at the purge command on database context. In document context this command works as a shortcut. But there's a difference: The second argument at the callback is only a boolean, that says if the document was purged (true) or not (false).

    doc.purge(callback);
    doc.purge(complete, callback);

**complete** - if you set this to true, it will purge the complete document (it makes a purge on the head revision)  
**callback** - function(error, purged) callback that will be called, if the purge command was done, or if there was an error


attachment api
--------------

### save attachment ###
**Description:** Files will always opened as UTF-8.

	doc.saveAttachment(file, contentType, callback)
	doc.saveAttachment(file, contentType, name, callback)
	
**file** - file path to the file  
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

### get, create, update or delete views ###
**Description:** If you only set one argument, you will get the object with the string representation of the map and reduce functions. If you set `map` and `reduce`, you will set a view. If there is no views object in the body, it will be created, so you don't have to create it by yourself. If you set map explicitly to `null`, the view will be deleted.

	design.view(name)
	design.view(name, map)
	design.view(name, map, reduce)

**name** - name of the view  
**map** - string representation of the map function  
**reduce** - string representation of the reduce function


### get, create, update or delete lists ###
**Description:** If you only set one argument, you will get the string representation of the list function. If you set the `content`, it will save to the list. If there is no lists object in the body, it will be created, so you don't have to create it by yourself. If you set content explicitly to `null`, the list function will be deleted.

	design.list(name)
	design.list(name, content)
	
**name** - name of the list  
**content** - string representation of the list function


### get, create, update or delete shows ###
**Description:** If you only set one argument, you will get the string representation of the show function. If you set the `content`, it will save to the show. If there is no shows object in the body, it will be created, so you don't have to create it by yourself. If you set content explicitly to `null`, the show function will be deleted.

	design.show(name)
	design.show(name, content)

**name** - name of the show  
**content** - string representation of the show function


### getting or setting validation handler
**Description:** If you set no arguments, you will get the current validation handler, otherwise you will set it and get the design document. Look at the [CouchDB Validation Doc Update Documentation](http://wiki.apache.org/couchdb/Document_Update_Validation).

    design.validateHandler();
    design.validateHandler(handler);

**handler**  string representation of the validation function.

**Example:**

    design.validateHandler(
      'function(newDoc, oldDoc, userCtx, secObj) {' +
        'if (newDoc.address === undefined) {' +
          'throw({forbidden: "Document must have an address."});' +
        '}' +
      '}'
    );


### getting or setting rewrites ###
**Description** With this you can set rewrite rules or get the current list of them. If you set no argument, you will get the current list of rewrites. If you set one argument, you will set the new rewrite list.

    design.rewrites()
    design.rewrites(rewrites)

**rewrites** - Array of rewrite rule objects. For further information look at the documentation [CouchDB Rewriting URLs](http://wiki.apache.org/couchdb/Rewriting_urls)


### getting view info ###

    design.viewInfo(callback)

**callback** - function(error, info) that will be called, after getting the infos or if there was an error

**Example:**

    design.viewInfo(function(error, info) {
      console.log(error || info);
    });


### compaction ###

	design.compact(callback)

**callback** - function(error, started) that will be called, after compaction was started or if there was an error


browser version
---------------
Cushion is also available in the browser. All you have to do is to load the `cushion.browser.min.js`. The initialization is a little bit different. In this example I use a proxy to connect to the CouchDB. 

    var connection = new cushion.Connection(
      'localhost', // host
      8080, // port
      'zoddy', // username
      'zoddy', // password
      {'path': 'couchdb'} // so all requests go to localhost:8080/couchdb <- proxy
    );	

After that all is the same and you have the full power of cushion in the browser.


running tests
-------------

To run the test suite first invoke the following command within the repo, installing the development dependencies:

	$ npm install

then run the tests:

    $ make test


upcoming features
-----------------

* session support
* bulk updates
* query params api


License
-------

(The MIT License)

Copyright (c) 2009-2012 André Kussmann <zoddy@zoddy.de>

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
