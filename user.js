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
 * adds a role
 *
 * @param {string} name name of the user
 * @param {string|array<string>} role a single role or a list of roles
 * @param {function(error, added)} callback function that will be called after
 *     saving the role(s), or if there was an error
 */
user.prototype.addRole = function(name, role, callback) {
  var roles = (typeof(role) === 'string') ? [role] : role;

  this._connection.database('_users').document(
    'org.couchdb.user:' + name
  ).load(function(error, document) {
    document.body(
      'roles',
      document.body('roles').concat(roles)
    ).save(function(error, document) {
      callback(error, (error) ? null : true);
    });
  });
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
  // password generation will change and then we would need a third variant
  this._lower120((function(error, lower) {
    if (error) {
      callback(error, null);
    } else {
      if (lower === true) {
        salt = this._salt();
        password = this._hash(password, salt);

        this._connection.database('_users').document(
          'org.couchdb.user:' + name
        ).body({
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


/**
 * deletes one or more roles from the user
 *
 * @param {string} name name of the user
 * @param {string|array<string>} role a single role or a list of roles
 * @param {function(error, deleted)} callback function that will be called after
 *     deleting the role(s), or if there was an error
 */
user.prototype.deleteRole = function(name, role, callback) {
  var deleteRoles = (typeof(role) === 'string') ? [role] : role;

  this._connection.database('_users').document(
    'org.couchdb.user:' + name
  ).load(function(error, document) {
    if (error) {
      callback(error, null);
    } else {
      document.body(
        'roles',
        document.body('roles').filter(function(role, index, roles) {
          return deleteRoles.some(function(deleteRole, index, allDeleteRoles) {
            return (deleteRole === role);
          });
        })
      ).save(function(error, document) {
        callback(error, (error) ? null : true);
      });
    }
  });
};


/**
 * getting list of roles
 *
 * @param {string} name name of the user
 * @param {function(error, roles)} callback function that will be called after
 *     getting the roles, or if there was an error
 */
user.prototype.getRoles = function(name, callback) {
  this._connection.database('_users').document(
    'org.couchdb.user:' + name
  ).load(function(error, document) {
    callback(error, (error) ? null : document.body('roles'));
  });
};


/**
 * generate password hash
 *
 * @private
 * @param {string} password plain password string
 * @param {string} salt hexadecimal salt string
 */
user.prototype._hash = function(password, salt) {
  return crypto.createHash('sha1').update(password + salt).digest('hex');
};


/**
 * generate salt
 *
 * @private
 * @return {string} hexadecimal random string
 */
user.prototype._salt = function() {
  return crypto.randomBytes(16).toString('hex');
};


/**
 * version lower than 1.2.0?
 *
 * @private
 * @param {function(error, lower)} callback function that will be called after
 *     looking for lower version or if there was an error
 */
user.prototype._lower120 = function(callback) {
  this._connection.version(function(error, version) {
    if (error) {
      callback(error, null);
    } else {
      version = version.split('.').map(function(part, index, complete) {
        return parseInt(part, 10);
      });

      callback(null, (version[0] < 1 || (version[0] === 1 && version[1] < 2)));
    }
  });
};


/**
 * sets/changes the password
 *
 * @param {string} name name of the user
 * @param {password} password for the user
 * @param {function(error, changed)} callback function that will be called after
 *     changing the password, or if there was an error
 */
user.prototype.password = function(name, password, callback) {
  var salt;

  this._connection.database('_users').document('org.couchdb.user:' + name).load(
    (function(error, document) {
      if (error) {
        callback(error, null);
      } else {
        this._lower120((function(error, lower) {
          if (error) {
            callback(error, null);
          } else {
            if (lower === true) {
              salt = this._salt();
              password = this._hash(password, salt);

              document.body('password_sha', password).body('salt', salt);
            } else {
              document
                .body('password_sha', undefined)
                .body('salt', undefined)
                .body('password', password);
            }

            document.save(function(error, document) {
              callback(error, (error) ? null : true);
            });
          }
        }).bind(this));
      }
    }).bind(this)
  );
};


exports.User = user;
