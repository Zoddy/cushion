var querystring = require('querystring');


/**
 * database object
 *
 * @constructor
 * @param {string} name name of the database
 * @param {nodecouch.Connection} connection connection object
 */
var Database = function(name, connection) {
  this._name = name;
  this._connection = connection;
};


/**
 * getting all documents of the database, because this is a special couchdb view
 * you can use the same query parameters like at normal views
 *
 * @param {object|function(error, info, documents)} paramsOrCallback query
 *     parameters for the view
 * @param {?function(error, info, object)} callback function that
 *     will be called, after getting response from the view, or if there was an
 *     error
 */
Database.prototype.allDocuments = function(paramsOrCallback, callback) {
  var params = (typeof(paramsOrCallback) === 'object') ?
               '?' + querystring.stringify(paramsOrCallback, '&', '=') :
               '';
  callback = (params === '') ? paramsOrCallback : callback;

  this._connection.request({
    'method': 'GET',
    'path': this.name() + '/_all_docs' + params,
    'callback': (function(error, response) {
      var info,
          documents = {},
          i;

      if (error === null) {
        info = {
          'total': response.total_rows,
          'offset': response.offset
        };

        for (i = 0; response.rows[i]; ++i) {
          documents[response.rows[i].id] = response.rows[i].value.rev;
        }
      }

      callback(error, info, documents);
    }).bind(this)
  });
};


/**
 * create the database
 *
 * @param {function(error, confirm)} callback function that will be called,
 *     after creating the database, or if there was an error
 */
Database.prototype.create = function(callback) {
  this._connection.request({
    'method': 'PUT',
    'path': this.name() + '/',
    'callback': (function(error, response) {
      if (error === null && response.ok === true) {
        response = true;
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * delete the database
 *
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the database, or if there was an error
 */
Database.prototype.delete = function(callback) {
  this._connection.request({
    'method': 'DELETE',
    'path': this.name() ,
    'callback': function(error, response) {
      if (response && response.ok === true) {
        response = true;
      }

      callback(error, response);
    }
  });
};


/**
 * gets a document object
 *
 * @param {?string} docId id of the couch document
 * @param {?string} revision revision of the document
 * @return {nodecouch.Document} the document object
 */
Database.prototype.document = function(docId, revision) {
  return new (require('./document.js').Document)(
    docId || null,
    revision || null,
    this._connection,
    this
  );
};


/**
 * check if database exists
 *
 * @param {function(error, exists)} callback function that will be called, after
 *     getting the information database exists or not, of if there was an error
 */
Database.prototype.exists = function(callback) {
  this._connection.request({
    'method': 'GET',
    'path': this._name,
    'callback': function(error, response) {
      if (error && error.error === 'not_found') {
        response = false;
      }

      callback(
        error,
        (error && error.error === 'not_found') ? false : true
      );
    }
  });
};


/**
 * gets infos about the database
 *
 * @param {function(error, info)} callback function that will be called, after
 *     getting the informations, or if there was an error
 */
Database.prototype.info = function(callback) {
  this._connection.request({
    'method': 'GET',
    'path': this._name,
    'callback': callback
  });
};


/**
 * requests a list
 *
 * @param {string} design name of the design document, after the '_design/'
 * @param {string} list name of the list function
 * @param {string} viewOrOtherDesign name of the view, or name of another design
 *     document, which holds the view function
 * @param {string|object|function(error, response)} viewOrParamsOrCallback name
 *     of the view function, or an object which holds query parameters for the
 *     request or function that will be called, after getting a response or if
 *     there was an error
 * @param {?object|function(error, response)} paramsOrCallback an object with
 *     key-value-pairs that holds query parameters for the request, or function
 *     that will be called, after getting a response, or if there was an error
 * @param {?function(error, response)} callback function that will be called,
 *     after getting a response or if there was an error
 */
Database.prototype.list = function(
  design,
  list,
  viewOrOtherDesign,
  viewOrParamsOrCallback,
  paramsOrCallback,
  callback
) {
  var params = (typeof(viewOrParamsOrCallback) === 'object') ?
               '?' + querystring.stringify(viewOrParamsOrCallback, '&', '=') :
               (typeof(paramsOrCallback) === 'object') ?
                 '?' + querystring.stringify(paramsOrCallback, '&', '=') :
                 '',
      callback = callback || ((typeof(viewOrParamsOrCallback) === 'function') ?
                 viewOrParamsOrCallback :
                 paramsOrCallback),
      view = (typeof(viewOrParamsOrCallback) === 'string') ?
             viewOrParamsOrCallback :
             viewOrOtherDesign,
      otherDesign = (typeof(viewOrParamsOrCallback) === 'string') ?
                    '/' + viewOrOtherDesign :
                    '',
      path = this.name() + '/_design/' + design + '/_list/' + list +
             otherDesign + '/' + view + params;

  this._connection.request({
    'method': 'GET',
    'path': path,
    'callback': callback
  });
};


/**
 * gets name of this database
 *
 * @return {string} name of this database
 */
Database.prototype.name = function() {
  return this._name;
};


/**
 * requests a view
 *
 * @param {string} design name of the design document, after the '_design/'
 * @param {string} view name of the view
 * @param {object|function(error, info, object)} paramsOrCallback query
 *     parameters for the view, or function that will be call, after getting
 *     response from the view, or if there was an error
 * @param {?function(error, info, object)} callback function that will be
 *     called, after getting response from the view, or if there was an error
 */
Database.prototype.view = function(design, view, paramsOrCallback, callback) {
  var params = (typeof(paramsOrCallback) === 'object') ?
               '?' + querystring.stringify(paramsOrCallback, '&', '=') :
               '',
      path = this.name() + '/_design/' + design + '/_view/' + view;
  callback = (params === '') ? paramsOrCallback : callback;

  this._connection.request({
    'method': 'GET',
    'path': path + params,
    'callback': (function(error, response) {
      var info = null,
          documents = {},
          i;

      if (error === null) {
        info = {
          'total': response.total_rows,
          'offset': response.offset
        };

        for (i = 0; response.rows[i]; ++i) {
          documents[response.rows[i].key] = {
            'id': response.rows[i].id,
            'value': response.rows[i].value
          }
        }
      }

      callback(error, info, documents);
    }).bind(this)
  });
};


exports.Database = Database;