// jshint settings
/*global require: false, exports: false */

var crypto = require('crypto');

/**
 * user object
 *
 * @constructor
 * @param {string} name name of the user
 * @param {cushion.Connection} connection cushion connection object
 */
var user = function(connection) {
  this._connection = connection;
};


/**
 * creates a user
 *
 * @param {string} name name of the user
 * @param {string} password password for the user
 * @param {array<string>|function(error, created)} rolesOrCallback list of roles
 *     for this user or function that will be called after creating the user
 *     account, or if there was an error
 * @param {?function(error, created)} callback function that will be called
 *     after creating the user account, or if there was an error
 */
user.prototype.create = function(
  name,
  password,
  rolesOrCallback,
  callback
) {
  var roles = (typeof(rolesOrCallback) === 'object') ? rolesOrCallback : [],
      callback = callback || rolesOrCallback,
      salt;

  // first we have to check the couchdb version
  // because with couchdb <1.2.0 we have to create the salt and password hash
  //
  // yes we could always create the sha password and salt, but at couchdb 1.3.0
  // password generation will change and then we need a third variant
  this._connection.version((function(error, version) {
    if (error) {
      callback(error, null);
    } else {
      version = version.split('.').map(function(part, index, complete) {
        return parseInt(part, 10);
      });

      if (version[0] < 1 || (version[0] === 1 && version[1] < 2)) {
        salt = crypto.randomBytes(16).toString('hex');
        password = crypto.createHash('sha1').update(password + salt).digest('hex');

        this._connection.database('_users').document('org.couchdb.user:' + name).body({
          'name': name,
          'type': 'user',
          'roles': roles,
          'password_sha': password,
          'salt': salt
        }).save(function(error, document) {
          callback(error, (error) ? null : true);
        });
      } else {
        this._connection.database('_users').document(
          'org.couchdb.user:' + name
        ).body({
          'name': name,
          'type': 'user',
          'roles': roles,
          'password': password
        }).save(function(error, document) {
          callback(error, (error) ? null : true);
        });
      }
    }
  }).bind(this));
};


/**
 * deletes an user
 *
 * @param {string} name name of the user
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the user account, or if there was an error
 */
user.prototype.delete = function(name, callback) {
  var document = this._connection.database('_users').document(
        'org.couchdb.user:' + name
      );

  document.info(function(error, info) {
    if (error) {
      callback(error, null);
    } else {
      document.destroy(function(error, document) {
        callback(error, (error) ? null : true);
      });
    }
  });
};


exports.User = user;
