// jshint settings
/*global require: false, exports: false */

var util = require('util'),
    Document = require('./document.js').Document;


/**
 * design document object
 *
 * @constructor
 * @param {string|null} id string if you have document id, null if not
 * @param {cushion.Connection} connection cushion connection object
 * @param {cushion.Database} database cushion database object
 */
var Design = function(id, revision, connection, database) {
  Document.call(this, id, revision, connection, database);
};

util.inherits(Design, Document);


/**
 * compacts the design document
 *
 * @param {function(error, started)} callback function that will be called,
 *     after compaction was started or if there was an error
 */
Design.prototype.compact = function(callback) {
  this._database.compact(this._id.substr(8), callback);
};


/**
 * get, create, update or delete a list function
 *
 * @param {string} name name of the list function
 * @param {?string} content string representation of the list function; if you
 *     set this to null, the list function will be deleted
 * @return {cushion.Design|string} if you save a list function, you will get
 *     this design document, otherwise the string representation of the specific
 *     list function
 */
Design.prototype.list = function(name, content) {
  if (content) {
    this.body('lists', name, ((content === null) ? undefined : content));
  }

  return ((content !== undefined) ?
    this :
    (this._body.lists) ? this._body.lists[name] : undefined
  );
};


/**
 * get, create, update or delete a show function
 *
 * @param {string} name name of the show function
 * @param {?string} content string representation of the show function; if you
 *     set this to null, the show function will be deleted
 * @return {cushion.Design|string} if you save a show function, you will get
 *     this design document, otherwise the string representation of the specific
 *     show function
 */
Design.prototype.show = function(name, content) {
  if (typeof(content) !== undefined) {
    this.body('shows', name, ((content === null) ? undefined : content));
  }

  return ((content !== undefined) ?
    this :
    (this._body.shows) ? this._body.shows[name] : undefined
  );
};


/**
 * get, create, update or delete a view
 *
 * @param {string} name name of the view
 * @param {string} map string representation of the map function; if you set
 *     this to null, the view will be deleted
 * @param {?string} reduce string representation of the reduce function
 * @return {cushion.Design|object} if you set a view, you will get this design
 *     document, otherwise you will get the view object with the string
 *     representations of the map and reduce functions
 */
Design.prototype.view = function(name, map, reduce) {
  var view = {};

  if (reduce) {
    view.reduce = reduce;
  }

  if (map !== undefined) {
    view.map = map;

    this.body('views', name, ((map === null) ? undefined : view));
  }

  return ((map !== undefined) ?
    this :
    (this._body.views) ? this._body.views[name] : undefined
  );
};

exports.Design = Design;
