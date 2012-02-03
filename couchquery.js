/**
 * makes a query string for couch request urls
 *
 * @constructor
 * @param {?object} params different query params, which follow
 *     key: {string|number|Array<string|number>} the key to search for, or an
 *          of keys
 */
var CouchQuery = function(params) {
  this._query = {};

  if (params) {
    this.add(params);
  }
};


/**
 * adding query params
 *
 * @param {object}
 */
CouchQuery.prototype.add = function(params) {
  var key;

  if (typeof(params) === 'object') {
    for (key in params) {
      if (this['_' + key]) {
        this['_' + key](params[key]);
      }
    }
  }
};


/**
 * function for the key query param
 *
 * @private
 * @param {string|number|array<string|number>} content value for the param
 */
CouchQuery.prototype._key = function(content) {
  if (typeof(content) === 'string') {
    this._query.key = '"' + content + '"';
  } else if (typeof(content) === 'number' || typeof(content) === 'boolean') {
    this._query.key = '' + content;
  } else if (Array.isArray(content)) {
    this._query.key = JSON.stringify(content);
  }
};


/**
 *

exports.CouchQuery = CouchQuery;