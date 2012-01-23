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


exports.Document = Document;