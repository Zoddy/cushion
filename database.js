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
    'path': this._name,
    'callback': callback
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
    'path': this._name,
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
 * @param {string} view name of the view, after the '_view/'
 * @param {object|function(error, info, object)} paramsOrCallback query
 *     parameters for the view
 * @param {?function(error, info, object)} callback function that
 *     will be called, after getting response from the view, or if there was an
 *     error
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