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
  this._connection.request('DELETE', this._name, function(error, response) {
    if (response && response.ok === true) {
      response = true;
    }

    callback(error, response);
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

exports.Database = Database;