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


exports.Document = Document;