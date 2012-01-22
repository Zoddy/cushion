var database = function(name, connection) {
  this._connection = connection;
  this._name = name;
};


/**
 * checks if a database exists
 *
 * @param {function(error, exists)} callback function that will be called,
 *     after we had the information if the database exists or not
 */
database.prototype.exists = function(callback) {
  this.getInfo(function(error, response) {
    if (response !== null) {
      if (response.error) {
        response = false;
      } else {
        response = true;
      }
    }

    callback(error, response);
  });
};


/**
 * gets a single document
 *
 * @param {string} documentID id for the couch document
 * @param {function(error, document)} callback function that will be called,
 *     after we have the document, or there was an error
 */
database.prototype.get = function(documentID, callback) {
  this._connection.request('GET', this._name + '/' + documentID, callback);
};


/**
 * gets info about a database
 *
 * @param {string} name name of the database
 * @param {function(error, response)} callback function that will be called
 *     after response or error
 */
database.prototype.getInfo = function(callback) {
  this._connection.request('GET', this._name, callback);
};


exports.database = database;