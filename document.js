/**
 * document object
 *
 * @constructor
 * @param {string|null} id string if you have document id, null if not
 * @param {nodecouch.Connection} connection nodecouch connection object
 * @param {nodecouch.Database} database nodecouch database object
 */
var Document = function(id, revision, connection, database) {
  this._id = id;
  this._revision = revision;
  this._connection = connection;
  this._database = database;
};


/**
 * create the document
 *
 * @param {Object} body content of the document
 * @param {function(error, nodecouch.Document)} callback function that will be
 *     called, after document was created, or if there was an error
 */
Document.prototype.create = function(body, callback) {
  this._connection.request(
    (this._id === null) ? 'POST' : 'PUT',
    this._database.name() + '/' + ((this._id === null) ? '' : this._id),
    (function (error, response) {
      if (response) {
        this._id = response.id;
        this._revision = response.rev;
      }

      callback(error, this);
    }).bind(this),
    body
  );
};


/**
 * delete the document, the id and revision have to set before, without it you
 * will get an error
 *
 * @param {function(error, nodecouch.Document)} callback function that will be
 *     called, after deleting the document, or if there was an error
 */
Document.prototype.delete = function(callback) {
  if (this._id === null) {
    callback({'error': 'no_delete', 'reason': 'no document id was set'}, null);
  } else if (this._revision === null) {
    callback({'error': 'no_delete', 'reason': 'no revision was set'}, null);
  } else {
    this._connection.request(
      'DELETE',
      this._database.name() + '/' + this._id + '?rev=' + this._revision,
      (function(error, response) {
        if (response) {
          this._revision = response.rev;
        }

        callback(error, this);
      }).bind(this)
    );
  }
};


/**
 * loads the document, the id have to set before, without it you will get an
 * error
 *
 * @param {function(error, nodecouch.Document)} callback function that will be
 *     called, after loading the document or if there was an error
 */
Document.prototype.load = function(callback) {
  if (this._id === null) {
    callback({'error': 'no_create', 'reason': 'no document id was set'}, null);
  } else {
    this._connection.request(
      'GET',
      this._database.name() + '/' + this._id,
      callback
    );
  }
};


exports.Document = Document;