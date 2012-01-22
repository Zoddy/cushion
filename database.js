var database = function(name, connection) {
  this._connection = connection;
  this._name = name;
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