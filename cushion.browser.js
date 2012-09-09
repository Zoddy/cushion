(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';

        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';

        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }

        var n = loadNodeModulesSync(x, y);
        if (n) return n;

        throw new Error("Cannot find module '" + x + "'");

        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }

            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }

        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }

            return loadAsFileSync(x + '/index');
        }

        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }

            var m = loadAsFileSync(x);
            if (m) return m;
        }

        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');

            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }

            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);

    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};

    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }

        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;

        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };

        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./cushion"}
});

require.define("/cushion.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
/*global require: false, exports: false */

var http = require('http'),
    defaultOptions = require('./config.js'),
    Database = require('./database.js').Database,
    UserApi = require('./user.js').User;

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 * @param {object} additional additional options:
 *     {boolean} [secure=false] set this to true, if you want https-connections
 *     {string} [path=''] set an additional path, if you want to connect through
 *         this (e.g. a proxy, because of connecting from browser)
 */
var cushion = function(host, port, username, password, additional) {
  additional = additional || {};

  this._methodMatch = /^GET|PUT|POST|DELETE|HEAD|COPY$/i;
  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
    'secure': additional.secure || defaultOptions.secure,
    'path': (additional.path) ? additional.path + '/' : defaultOptions.path
  };

  if (this._options.secure === true) {
    http = require('https');
  }
};


/**
 * returns a list of active tasks
 *
 * @param {function(error, activeTasks)} callback function that will called,
 *     after getting the list of active tasks or if there was an error
 */
cushion.prototype.activeTasks = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_active_tasks',
    'callback': callback
  });
};


/**
 * set or get configuration params
 * if you set:
 *   one param: you will get the complete configuration
 *   two params: you will get all options of the specific section
 *   three params: you will get the content of the specific option
 *   four params: you set a specific option to the new value, or you delete the
 *                given option, if you set value to null
 *
 * @param {string|function(error, configuration)} sectionOrCallback a section of
 *     different config params or function that will be called, after getting
 *     the whole configuration or if there was an error
 * @param {?string|function(error, options)} optionOrCallback an specific option
 *     or a function, that will be called, after getting the options of the
 *     section of if there was an error
 * @param {?string|function(error, value)} valueOrCallback the new value for the
 *     option or function that will be called, after getting the content of the
 *     option; if you set the value to null, option will be deleted
 * @param {?function(error, saved)} callback function that will be called after
 *     saving the new value, or if there was an error
 */
cushion.prototype.config = function(
  sectionOrCallback,
  optionOrCallback,
  valueOrCallback,
  callback
) {
  var section = (typeof(sectionOrCallback) === 'string') ?
        sectionOrCallback :
        null,
      option = (typeof(optionOrCallback) === 'string') ?
        optionOrCallback :
        null,
      value = (
        typeof(valueOrCallback) === 'string' ||
        typeof(valueOrCallback) === 'number' ||
        valueOrCallback === null
      ) ? valueOrCallback : undefined,
      options;
  callback = callback ||
    valueOrCallback ||
    optionOrCallback ||
    sectionOrCallback;

  options = {
    'method': (value !== undefined) ?
      ((value === null) ? 'DELETE' : 'PUT') :
      'GET',
    'path': '_config' +
      ((section) ? '/' + section : '') +
      ((option) ? '/' + option : ''),
    'callback': function(error, response) {
      if (error) {
        response = null;
      } else {
        response = (value !== undefined) ? true : response;
      }

      callback(error, response);
    }
  };

  // do we set a new value?
  if (typeof(value) === 'string' || typeof(value) === 'number') {
    options.body = '"' + value + '"';
  }

  this.request(options);
};


/**
 * creates an admin
 *
 * @param {string} name name of the admin account
 * @param {string} password password of the admin account
 * @param {function(error, created)} callback function that will be called after
 *     creating the admin account, or if there was an error
 */
cushion.prototype.createAdmin = function(name, password, callback) {
  // first we have to create a new option at the config
  this.config('admins', name, password, (function(error, created) {
    // after that we have to create a user document
    var database,
        document;

    if (created === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.body('name', name);
      document.body('type', 'user');
      document.body('roles', []);
      document.save(function(error, document) {
        if (error) {
          callback(error, null);
        } else {
          callback(error, true);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * gives a connection to a specific database
 *
 * @param {string} name name of the database
 * @return {Object} the database object
 */
cushion.prototype.database = function(name) {
  return new Database(name, this);
};


/**
 * deletes an admin
 *
 * @param {string} name username of the admin
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the admin account, or if there was an error
 */
cushion.prototype.deleteAdmin = function(name, callback) {
  // first we have to delete the admin option
  this.config('admins', name, null, (function(error, deleted) {
    // after that we have to delete the user document
    var database,
        document;

    if (deleted === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.load(function(error, document) {
        if (document) {
          document.destroy(function(error, document) {
            if (document) {
              callback(null, true);
            } else {
              callback(error, null);
            }
          });
        } else {
          callback(error, null);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * retrieving a list of databases
 *
 *
 * @param {boolean|function(error, databases)} noCouchRelatedOrCallback filters
 *     all couch related databases, so the list has only databases which a user
 *     has set up or function that will be called after retrieving a list of
 *     databases, or if there was an error
 * @param {?function()} callback function that will be called after retrieving a
 *     list of databases, or if there was an error
 */

cushion.prototype.listDatabases = function(noCouchRelatedOrCallback, callback) {
  var noCouchRelated = (callback) ? noCouchRelatedOrCallback : null;
  callback = callback || noCouchRelatedOrCallback;

  this.request({
    'method': 'GET',
    'path': '_all_dbs',
    'callback': (function (error, response) {
      if (error === null && response !== null) {
        // filter couch related databases, if user want's so
        if (noCouchRelated === true) {
          response = response.filter(function(dbName, index, list) {
            return (dbName[0] !== '_');
          });
        }

        // create database objects
        response = response.map(function(dbName) {
          return this.database(dbName);
        }, this);
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * returns the tail of the server's log file
 *
 * @param {number|function(error, log)} bytesOrCallback number of bytes how many
 *     do you want from the tail or function that will be called, after getting
 *     the log or if there was an error
 * @param {?function(error, log)} callback function that will be called, after
 *     getting the log or if there was an error
 */
cushion.prototype.log = function(bytesOrCallback, callback) {
  var bytes = (arguments.length > 1) ? bytesOrCallback : null;
  callback = callback || bytesOrCallback;

  this.request({
    'method': 'GET',
    'path': '_log' + ((bytes) ? '?bytes=' + bytes : ''),
    'callback': callback
  });
};


/**
 * wrapper function for any request to the couchdb
 *
 * @param {Function} callback function that will be called after all data events
 * @param {http.ClientResponse} response the http response object
 */
cushion.prototype._request = function(callback, response) {
  var content = '';

  response.on('data', function(chunk) {
    content += chunk;
  });

  response.on('end', (function() {
    try {
      if (
        response.headers['content-type'] === 'application/json' &&
        content.length > 0
      ) {
        content = JSON.parse(content);
      }

      if (response.statusCode === 404 && content.length === 0) {
        content = {
          'error': 'not_found',
          'reason': 'missing'
        };
      }

      callback(
        (content.error) ? content : null,
        (!content.error) ? content : null,
        response.headers || null
      );
    } catch(error) {
      callback(error, null, null);
    }
  }).bind(this));
};


/**
 * sends a request to the couch
 *
 * @param {object} properties options for the request
 *      method: {string} http method, can be GET, PUT, POST, DELETE, HEAD, COPY
 *      path: {string} uri path after domain
 *      headers: {Object} key/value-pairs of additional http headers
 *      body: {Object|Array} additional body
 *      callback: {function(error, response)} function that will be called,
 *                after getting the response or if there was an error
 */
cushion.prototype.request = function(properties) {
  var options = {
        'host': this._options.host,
        'port': this._options.port,
        'method': (
                    typeof(properties.method) === 'string' &&
                    properties.method.match(this._methodMatch) !== null
                  ) ?
                  properties.method :
                  'GET',
        'path': '/' + this._options.path + (properties.path || ''),
        'auth': this._options.username + ':' + this._options.password,
        'headers': properties.headers || {}
      },
      request;

  // make sure, that we get application/json response from couchdb
  options.headers.Accept = options.headers.Accept || '*/*,application/json';
  options.headers['Content-Type'] = options.headers['Content-Type'] ||
    'application/json';

  // set up request object
  request = http.request(
    options,
    this._request.bind(this, properties.callback)
  );

  // define callback, if there is an error
  request.on('error', (function(error) {
    properties.callback(error, null, null);
  }).bind(this));

  // adding optional body to the request
  if (properties.body) {
    if (typeof(properties.body) === 'object') {
      request.write(JSON.stringify(properties.body));
    } else {
      request.write(properties.body);
    }
  }

  // starting request
  request.end();
};


/**
 * restarts the couchdb
 *
 * @param {function(error, restart)} callback function that will be called,
 *     after initializing the restart or if there was an error
 */
cushion.prototype.restart = function(callback) {
  this.request({
    'method': 'POST',
    'path': '_restart',
    'callback': function(error, restart) {
      if (error && error.code === 'ECONNRESET') {
        error = null;
        restart = true;
      }

      callback(error, restart);
    }
  });
};


/**
 * returns server statistics
 *
 * @param {function(error, stats)} callback function that will be called, after
 *     getting the statistics of if there was an error
 */
cushion.prototype.stats = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_stats',
    'callback': callback
  });
};


/**
 * get the user object
 *
 * @return {cushion.User} the user object
 */
cushion.prototype.user = function() {
  return new UserApi(this);
};


/**
 * returns a list of generated uuids
 *
 * @param {number|function(error, uuidList)} countOrCallback number of uuids to
 *     generate or function that will be called, after getting the list of uuids
 *     or if there was an error
 * @param {?function(error, uuidList)} callback function that will be called,
 *     after getting the list of uuids or if there was an error
 */
cushion.prototype.uuids = function(countOrCallback, callback) {
  var count = (arguments.length > 1) ? countOrCallback : null;
  callback = callback || countOrCallback;

  this.request({
    'method': 'GET',
    'path': '_uuids' + ((count) ? '?count=' + count : ''),
    'callback': function(error, uuidList) {
      if (uuidList) {
        uuidList = uuidList.uuids;
      }

      callback(error, uuidList);
    }
  });
};


/**
 * gets the version of the couchdb
 *
 * @param {Function(version)} callback function that will be called after
 */
cushion.prototype.version = function(callback) {
  this.request({
    'method': 'GET',
    'path': '',
    'callback': function(error, response) {
      if (response !== null) {
        response = response.version;
      }

      callback(error, response);
    }
  });
};


exports.Connection = cushion;

});

require.define("http",function(require,module,exports,__dirname,__filename,process){module.exports = require("http-browserify")
});

require.define("/node_modules/http-browserify/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"index.js","browserify":"index.js"}
});

require.define("/node_modules/http-browserify/index.js",function(require,module,exports,__dirname,__filename,process){var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');

http.request = function (params, cb) {
    if (!params) params = {};
    if (!params.host) params.host = window.location.host.split(':')[0];
    if (!params.port) params.port = window.location.port;

    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

});

require.define("events",function(require,module,exports,__dirname,__filename,process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/http-browserify/lib/request.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter;
var Response = require('./response');
var concatStream = require('concat-stream')

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.xhr = xhr;
    self.body = concatStream()

    var uri = params.host + ':' + params.port + (params.path || '/');

    xhr.open(
        params.method || 'GET',
        (params.scheme || 'http') + '://' + uri,
        true
    );

    if (params.headers) {
        Object.keys(params.headers).forEach(function (key) {
            if (!self.isSafeRequestHeader(key)) return;
            var value = params.headers[key];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    xhr.setRequestHeader(key, v);
                });
            }
            else xhr.setRequestHeader(key, value)
        });
    }

    var res = new Response;
    res.on('ready', function () {
        self.emit('response', res);
    });

    xhr.onreadystatechange = function () {
        res.handle(xhr);
    };
};

Request.prototype = new EventEmitter;

Request.prototype.setHeader = function (key, value) {
    if ((Array.isArray && Array.isArray(value))
    || value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            this.xhr.setRequestHeader(key, value[i]);
        }
    }
    else {
        this.xhr.setRequestHeader(key, value);
    }
};

Request.prototype.write = function (s) {
    this.body.write(s);
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.write(s);
    this.body.end()
    this.xhr.send(this.body.getBody());
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return (Request.unsafeHeaders.indexOf(headerName.toLowerCase()) === -1)
};

});

require.define("/node_modules/http-browserify/lib/response.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter;

var Response = module.exports = function (res) {
    this.offset = 0;
};

Response.prototype = new EventEmitter;

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;

        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];

            if (headers[key] !== undefined) {
                if ((Array.isArray && Array.isArray(headers[key]))
                || headers[key] instanceof Array) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = xhr.responseType.toLowerCase();
    if (respType === "blob") return xhr.responseBlob;
    if (respType === "arraybuffer") return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }

        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}

        try {
            this.write(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this.write(res);

        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
    }
};

Response.prototype.write = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

});

require.define("/node_modules/http-browserify/node_modules/concat-stream/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {}
});

require.define("/node_modules/http-browserify/node_modules/concat-stream/index.js",function(require,module,exports,__dirname,__filename,process){var stream = require('stream')
var util = require('util')

function ConcatStream(cb) {
  stream.Stream.call(this)
  this.writable = true
  if (cb) this.cb = cb
  this.body = []
  if (this.cb) this.on('error', cb)
}

util.inherits(ConcatStream, stream.Stream)

ConcatStream.prototype.write = function(chunk) {
  this.body.push(chunk)
}

ConcatStream.prototype.arrayConcat = function(arrs) {
  if (arrs.length === 0) return []
  if (arrs.length === 1) return arrs[0]
  return arrs.reduce(function (a, b) { return a.concat(b) })
}

ConcatStream.prototype.isArray = function(arr) {
  var isArray = Array.isArray(arr)
  var isTypedArray = arr.toString().match(/Array/)
  return isArray || isTypedArray
}

ConcatStream.prototype.getBody = function () {
  if (this.body.length === 0) return
  if (typeof(this.body[0]) === "string") return this.body.join('')
  if (this.isArray(this.body[0])) return this.arrayConcat(this.body)
  if (typeof(Buffer) !== "undefined" && Buffer.isBuffer(this.body[0])) {
    return Buffer.concat(this.body)
  }
  return this.body
}

ConcatStream.prototype.end = function() {
  if (this.cb) this.cb(false, this.getBody())
}

module.exports = function(cb) {
  return new ConcatStream(cb)
}

module.exports.ConcatStream = ConcatStream

});

require.define("stream",function(require,module,exports,__dirname,__filename,process){var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once, and
  // only when all sources have ended.
  if (!dest._isStdio && (!options || options.end !== false)) {
    dest._pipeCount = dest._pipeCount || 0;
    dest._pipeCount++;

    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

});

require.define("util",function(require,module,exports,__dirname,__filename,process){var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

});

require.define("/config.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
/*global exports: false */

exports.host = '127.0.0.1';
exports.port = 5984;
exports.username = '';
exports.password = '';
exports.secure = false;
exports.path = '';

});

require.define("/database.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
/*global require: false, exports: false */

var querystring = require('querystring'),
    Document = require('./document.js').Document,
    Design = require('./design.js').Design;


/**
 * database object
 *
 * @constructor
 * @param {string} name of the database
 * @param {cushion.Connection} connection connection object
 */
var Database = function(name, connection) {
  this._name = name;
  this._connection = connection;
};


/**
 * getting all documents of the database, because this is a special couchdb view
 * you can use the same query parameters like at normal views
 *
 * @param {object|function(error, info, documents)} paramsOrCallback query
 *     parameters for the view
 * @param {?function(error, info, object)} callback function that
 *     will be called, after getting response from the view, or if there was an
 *     error
 */
Database.prototype.allDocuments = function(paramsOrCallback, callback) {
  var params = (typeof(paramsOrCallback) === 'object') ?
               '?' + querystring.stringify(paramsOrCallback, '&', '=') :
               '';
  callback = callback || paramsOrCallback;

  this._connection.request({
    'method': 'GET',
    'path': this.name() + '/_all_docs' + params,
    'callback': (function(error, response) {
      var info,
          documents = {},
          i;

      if (error === null) {
        info = {
          'total': response.total_rows,
          'offset': response.offset
        };

        for (i = 0; response.rows[i]; ++i) {
          documents[response.rows[i].id] = response.rows[i].value.rev;
        }
      }

      callback(error, info, documents);
    }).bind(this)
  });
};


/**
 * cleanup views
 *
 * @param {function(error, started)} callback function that will be called,
 *     after cleanup was started or if there was an error
 */
Database.prototype.cleanup = function(callback) {
  this._connection.request({
    'method': 'POST',
    'path': this.name() + '/_view_cleanup',
    'callback': function(error, response) {
      callback(error, (response) ? true : null);
    }
  });
};


/**
 * compacts the database or specific view
 *
 * @param {string} designOrCallback name of a design if you only want to compact
 *     a view, or function that will be called, after compaction was started of
 *     if there was an error
 * @param {?function(error, started)} callback function that will be called,
 *     after compaction was started or if there was an error
 */
Database.prototype.compact = function(designOrCallback, callback) {
  var design = (callback) ? designOrCallback : undefined,
      callback = callback || designOrCallback;

  this._connection.request({
    'method': 'POST',
    'path': this.name() + '/_compact' + ((design) ? '/' + design : ''),
    'callback': (function(error, response) {
      callback(error, (response) ? true : null);
    }).bind(this)
  });
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
    'path': this.name(),
    'callback': (function(error, response) {
      if (error === null && response.ok === true) {
        response = true;
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * delete the database
 *
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the database, or if there was an error
 */
Database.prototype.destroy = function(callback) {
  this._connection.request({
    'method': 'DELETE',
    'path': this.name() ,
    'callback': function(error, response) {
      if (response && response.ok === true) {
        response = true;
      }

      callback(error, response);
    }
  });
};


/**
 * gets a document object
 *
 * @param {?string} docId id of the couch document
 * @param {?string} revision revision of the document
 * @return {cushion.Document} the document object
 */
Database.prototype.document = function(docId, revision) {
  var Doc = (docId && docId.match(/^_design\//)) ? Design : Document;

  return new Doc(
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
      var exists = true;

      if (error && error.error === 'not_found') {
        error = null;
        exists = false;
      }

      callback(error, (error === null) ? exists : null);
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
 * requests a list
 *
 * @param {string} design name of the design document, after the '_design/'
 * @param {string} list name of the list function
 * @param {string} viewOrOtherDesign name of the view, or name of another design
 *     document, which holds the view function
 * @param {string|object|function(error, response)} viewOrParamsOrCallback name
 *     of the view function, or an object which holds query parameters for the
 *     request or function that will be called, after getting a response or if
 *     there was an error
 * @param {?object|function(error, response)} paramsOrCallback an object with
 *     key-value-pairs that holds query parameters for the request, or function
 *     that will be called, after getting a response, or if there was an error
 * @param {?function(error, response)} callback function that will be called,
 *     after getting a response or if there was an error
 */
Database.prototype.list = function(
  design,
  list,
  viewOrOtherDesign,
  viewOrParamsOrCallback,
  paramsOrCallback,
  callback
) {
  var params = (typeof(viewOrParamsOrCallback) === 'object') ?
               '?' + querystring.stringify(viewOrParamsOrCallback, '&', '=') :
               (typeof(paramsOrCallback) === 'object') ?
                 '?' + querystring.stringify(paramsOrCallback, '&', '=') :
                 '',
      view = (typeof(viewOrParamsOrCallback) === 'string') ?
             viewOrParamsOrCallback :
             viewOrOtherDesign,
      otherDesign = (typeof(viewOrParamsOrCallback) === 'string') ?
                    '/' + viewOrOtherDesign :
                    '',
      path = this.name() + '/_design/' + design + '/_list/' + list +
             otherDesign + '/' + view + params;
      callback = callback || paramsOrCallback || viewOrParamsOrCallback;

  this._connection.request({
    'method': 'GET',
    'path': path,
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


/**
 * retrieving a show function
 *
 * @param {string} design name of the design document, after the '_design/',
 * @param {string} show name of the show function
 * @param {string|object|function(error, result)} docIdOrQueryOrCallback id of
 *     the document or additional query params for the show function, or
 *     function that will be called after getting a result or if there was an
 *     error
 * @param {?object|function(error, result)} queryOrCallback additional query
 *     params for the show function, or function that will be called after
 *     getting a result or if there was an error
 * @param {?function(error, result)} callback function that will be called after
 *     getting a result or if there was an error
 */
Database.prototype.show = function(
  design,
  show,
  docIdOrQueryOrCallback,
  queryOrCallback,
  callback
) {
  var docId = (typeof(docIdOrQueryOrCallback) === 'string') ?
        '/' + docIdOrQueryOrCallback :
        '',
      query = '';
  callback = callback || queryOrCallback || docIdOrQueryOrCallback;

  if (typeof(docIdOrQueryOrCallback) === 'object') {
    query = '?' + querystring.stringify(docIdOrQueryOrCallback, '&', '=');
  } else if (typeof(queryOrCallback) === 'object') {
    query = '?' + querystring.stringify(queryOrCallback, '&', '=');
  }

  this._connection.request({
    'method': 'GET',
    'path': this._name +
      '/_design/' + design +
      '/_show/' + show +
      docId + query,
    'callback': callback
  });
};


/**
 * requests a view
 *
 * @param {string} design name of the design document, after the '_design/'
 * @param {string} view name of the view
 * @param {object|function(error, info, object)} paramsOrCallback query
 *     parameters for the view, or function that will be call, after getting
 *     response from the view, or if there was an error
 * @param {?function(error, info, object)} callback function that will be
 *     called, after getting response from the view, or if there was an error
 */
Database.prototype.view = function(design, view, paramsOrCallback, callback) {
  var params = (typeof(paramsOrCallback) === 'object') ?
               '?' + querystring.stringify(paramsOrCallback, '&', '=') :
               '',
      path = this.name() + '/_design/' + design + '/_view/' + view;
  callback = callback || paramsOrCallback;

  this._connection.request({
    'method': 'GET',
    'path': path + params,
    'callback': (function(error, response) {
      var info = null,
          documents = {},
          i;

      if (error === null) {
        info = {
          'total': response.total_rows,
          'offset': response.offset
        };

        for (i = 0; response.rows[i]; ++i) {
          documents[response.rows[i].key] = {
            'id': response.rows[i].id,
            'value': response.rows[i].value
          };
        }
      }

      callback(error, info, documents);
    }).bind(this)
  });
};


exports.Database = Database;
});

require.define("querystring",function(require,module,exports,__dirname,__filename,process){var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

});

require.define("/document.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
/*global require: false, exports: false, process: false */

var fs = require('fs');


/**
 * document object
 *
 * @constructor
 * @param {string|null} id string if you have document id, null if not
 * @param {cushion.Connection} connection cushion connection object
 * @param {cushion.Database} database cushion database object
 */
var Document = function(id, revision, connection, database) {
  this._id = id;
  this._revision = revision;
  this._connection = connection;
  this._database = database;
  this._body = {};

  this._error = {
    'noId': 'no document id was set',
    'noRevision': 'no revision was set',
    'noFile': 'could not read file'
  };
};


/**
 * gets the body of the document or saves data to it
 * if you want to save data, you can set one argument for each child, e.g.
 * .body('foo', 'bar', 'foobar'); that means you set foo.bar to 'foobar'
 * if there are is no foo.bar it will be created
 * if you set the body and the content argument (the last one) was explicitly
 * set to 'undefined', the property will be deleted
 *
 * @return {object|cushion.Document} get a deep copy of the document body, or
 *     the document, if you save data to the body
 */
Document.prototype.body = function() {
  var obj = Array.prototype.slice.call(arguments),
      data = obj.splice(obj.length - 1, 1)[0],
      path = this._body,
      returnData;

  if (obj && obj.length > 0 && arguments.length > 1) {
    // go through arguments list to set body members
    obj.forEach(function(name, index, array) {
      if (index === array.length - 1 && typeof(data) === 'undefined') {
        delete path[name];
      } else {
        path[name] = (index === array.length - 1) ? data : path[name] || {};
        path = path[name];
      }
    });

    returnData = this;
  } else if (obj && arguments.length > 0) {
    if (typeof(data) === 'object') {
      // we want to set the complete body
      this._body = JSON.parse(JSON.stringify(data));

      returnData = this;
    } else {
      // we don't set anything, but we want a specific body property
      returnData = (typeof(this._body[data]) === 'object') ?
        JSON.parse(JSON.stringify(this._body[data])) :
        this._body[data];
    }
  } else {
    // we don't set anything, but we want the complete body
    returnData = JSON.parse(JSON.stringify(this._body));
  }

  return returnData;
};


/**
 * copy a document, the document id have to set before, first document at the
 * callback is the current document, second document is the target document
 *
 * @param {string} targetId target document id
 * @param {string|function(error, cushion.Document, cushion.Document)}
 *     targetRevisionOrCallback copy to a specific document revision, or
 *     function that will be called, after copying the document or if there was
 *     error
 * @param {?function(error, cushion.Document, cushion.Document)} callback
 *     function that will be called copying the document or if there was an
 *     error
 */
Document.prototype.copy = function(
  targetId,
  targetRevisionOrCallback,
  callback
) {
  var targetRevision = (callback) ? '?rev=' + targetRevisionOrCallback : '';
  callback = callback || targetRevisionOrCallback;

  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_copy', 'reason': this._error.noId},
      null,
      null
    ));
  } else {
    this._connection.request({
      'method': 'COPY',
      'headers': {'Destination': targetId + targetRevision},
      'path': this._database.name() + '/' +
        this._id +
        ((this._revision) ? '?rev=' + this._revision : ''),
      'callback': (function(error, response) {
        if (response) {
          response = this._database.document(response.id, response.rev);
        }

        callback(error, this, response);
      }).bind(this)
    });
  }
};


/**
 * deletes an attachment
 *
 * @param {string} name attachment name
 * @param {function(error, deleted)} callback function that will be called,
 *     after the attachment was deleted
 */
Document.prototype.deleteAttachment = function(name, callback) {
  this._connection.request({
    'method': 'DELETE',
    'path': this._database.name() + '/' +
            this._id + '/' + name +
            '?rev=' + this._revision,
    'callback': (function(error, confirmed) {
      if (error) {
        confirmed = false;
      } else {
        this._revision = confirmed.rev;
        confirmed = true;
      }

      callback(error, confirmed);
    }).bind(this)
  });
};


/**
 * delete the document, the id and revision have to set before, without it you
 * will get an error
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after deleting the document, or if there was an error
 */
Document.prototype.destroy = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_delete', 'reason': this._error.noId},
      null
    ));
  } else if (this._revision === null) {
    process.nextTick(callback(
      {'error': 'no_delete', 'reason': this._error.noRevision},
      null
    ));
  } else {
    this._connection.request({
      'method': 'DELETE',
      'path': this._database.name() + '/' + this._id + '?rev=' + this._revision,
      'callback': (function(error, response) {
        if (response) {
          this._revision = response.rev;
        }

        callback(error, this);
      }).bind(this)
    });
  }
};


/**
 * load an attachment
 *
 * @param {string} name attachment name
 * @param {function(error, attachment)} callback function that will be called,
 *     after the attachment was loaded
 */
Document.prototype.getAttachment = function(name, callback) {
  this._connection.request({
    'method': 'GET',
    'path': this._database.name() + '/' +
            this._id + '/' + name +
            '?rev=' + this._revision,
    'callback': callback
  });
};


/**
 * get the id of the document
 *
 * @return {string} id of document
 */
Document.prototype.id = function() {
  return this._id;
};


/**
 * info about the document
 *
 * @param {function(error, info)} callback function that will called, after
 *     retrieving information, or if there was an error
 */
Document.prototype.info = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_info', 'reason': 'no document id was set'},
      null
    ));
  } else {
    this._connection.request({
      'method': 'HEAD',
      'path': this._database.name() + '/' + this._id,
      'callback': (function(error, response, headers) {
        var info = null;

        if (error === null) {
          this._revision = headers.etag.substr(1, headers.etag.length - 2);

          info = {
            'revision': this._revision,
            'size': headers['content-length']
          };
        }

        callback(error, info);
      }).bind(this)
    });
  }
};


/**
 * loads the document, the id have to set before, without it you will get an
 * error
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after loading the document or if there was an error
 */
Document.prototype.load = function(callback) {
  if (this._id === null) {
    process.nextTick(callback(
      {'error': 'no_load', 'reason': this._error.noId},
      null
    ));
  } else {
    this._connection.request({
      'method': 'GET',
      'path': this._database.name() + '/' +
              this._id +
              ((this._revision !== null) ? '?rev=' + this._revision : ''),
      'callback': (function(error, response) {
        if (error === null) {
          // get document content
          this._saveContent(response);
        }

        callback(error, this);
      }).bind(this)
    });
  }
};


/**
 * get the revision of the document
 *
 * @return {string} revision of the document
 */
Document.prototype.revision = function() {
  return this._revision;
};


/**
 * saves content at the document
 * try to creates a new document, if there's no revision
 * if you want to save an existing document, you have to .load() it before, so
 * the revision id will be saved here
 *
 * @param {function(error, cushion.Document)} callback function that will be
 *     called, after saving the new content or if there was an error
 */
Document.prototype.save = function(callback) {
  var body = JSON.parse(JSON.stringify(this._body));

  if (this._revision !== null) {
    body._rev = this._revision;
  }

  this._connection.request({
    'method': (this._id === null) ? 'POST' : 'PUT',
    'path': this._database.name() + ((this._id === null) ? '' : '/' + this._id),
    'body': body,
    'callback': (function (error, response) {
      if (error === null) {
        this._id = response.id;
        this._revision = response.rev;
      }

      callback(error, this);
    }).bind(this)
  });
};


/**
 * saves an attachment
 *
 * @param {string} file path to the file
 * @param {string} contentType content type header of the file (e.g. text/plain)
 * @param {string|function(error, response)} name of the attachment or function
 *     that will be called, after saving the attachment; if you don't set the
 *     name, it will be automatically the name of the file
 * @param {?function(error, response)} callback function that will be called,
 *     after saving the attachment
 */
Document.prototype.saveAttachment = function(
  file,
  contentType,
  nameOrCallback,
  callback
) {
  var filename = (typeof(nameOrCallback) === 'string') ?
        nameOrCallback :
        file.split('/').pop();
  callback = callback || nameOrCallback;

  fs.readFile(file, 'utf8', (function(error, data) {
    if (error) {
      process.nextTick(callback({
        'error': 'no_file',
        'reason': this._error.noFile + ': ' + file
      }, null));
    } else {
      this._connection.request({
        'method': 'PUT',
        'path': this._database.name() + '/' +
                this._id + '/' + filename +
                '?rev=' + this._revision,
        'headers': {
          'Content-Length': data.length,
          'Content-Type': contentType
        },
        'body': data,
        'callback': (function(error, confirmed) {
          if (error) {
            confirmed = false;
          } else {
            this._revision = confirmed.rev;
            confirmed = true;
          }

          callback(error, confirmed);
        }).bind(this)
      });
    }
  }).bind(this));
};


/**
 * saves the content of a whole document response
 *
 * @param {object} body content of the document
 */
Document.prototype._saveContent = function(body) {
  var key;
  body = JSON.parse(JSON.stringify(body));

  this._body = {};

  for (key in body) {
    if (key[0] === '_') {
      if (key === '_rev') {
        this._revision = body[key];
      }
    } else {
      this._body[key] = body[key];
    }
  }
};


exports.Document = Document;
});

require.define("fs",function(require,module,exports,__dirname,__filename,process){// nothing to see here... no file methods for the browser

});

require.define("/design.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
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

});

require.define("/user.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
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

});

require.define("crypto",function(require,module,exports,__dirname,__filename,process){module.exports = require("crypto-browserify")
});

require.define("/node_modules/crypto-browserify/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {}
});

require.define("/node_modules/crypto-browserify/index.js",function(require,module,exports,__dirname,__filename,process){var sha = require('./sha')
var rng = require('./rng')

var algorithms = {
  sha1: {
    hex: sha.hex_sha1,
    binary: sha.b64_sha1,
    ascii: sha.str_sha1
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) {
  alg = alg || 'sha1'
  if(!algorithms[alg])
    error('algorithm:', alg, 'is not yet supported')
  var s = ''
  var _alg = algorithms[alg]
  return {
    update: function (data) {
      s += data
      return this
    },
    digest: function (enc) {
      enc = enc || 'binary'
      var fn
      if(!(fn = _alg[enc]))
        error('encoding:', enc , 'is not yet supported for algorithm', alg)
      var r = fn(s)
      s = null //not meant to use the hash after you've called digest.
      return r
    }
  }
}

exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, rng(size));
    } catch (err) { callback(err); }
  } else {
    return rng(size);
  }
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
;['createCredentials'
, 'createHmac'
, 'createCypher'
, 'createCypheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDeffieHellman'
, 'pbkdf2'].forEach(function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

});

require.define("/node_modules/crypto-browserify/sha.js",function(require,module,exports,__dirname,__filename,process){/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

exports.hex_sha1 = hex_sha1;
exports.b64_sha1 = b64_sha1;
exports.str_sha1 = str_sha1;
exports.hex_hmac_sha1 = hex_hmac_sha1;
exports.b64_hmac_sha1 = b64_hmac_sha1;
exports.str_hmac_sha1 = str_hmac_sha1;

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}


});

require.define("/node_modules/crypto-browserify/rng.js",function(require,module,exports,__dirname,__filename,process){// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  // currently only available in webkit-based browsers.
  if (_global.crypto && crypto.getRandomValues) {
    var _rnds = new Uint32Array(4);
    whatwgRNG = function(size) {
      var bytes = new Array(size);
      crypto.getRandomValues(_rnds);

      for (var c = 0 ; c < size; c++) {
        bytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;
      }
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())
});

require.define("https",function(require,module,exports,__dirname,__filename,process){module.exports = require('http');

});

require.define("/cushion.js",function(require,module,exports,__dirname,__filename,process){// jshint settings
/*global require: false, exports: false */

var http = require('http'),
    defaultOptions = require('./config.js'),
    Database = require('./database.js').Database,
    UserApi = require('./user.js').User;

/**
 * create connection to a couchdb
 *
 * @param {string} [host=this._options.host] host address
 * @param {number} [port=this._options.port] port
 * @param {string} [username=this._options.username] username for authorization
 * @param {string} [password=this._options.password] password for authorization
 * @param {object} additional additional options:
 *     {boolean} [secure=false] set this to true, if you want https-connections
 *     {string} [path=''] set an additional path, if you want to connect through
 *         this (e.g. a proxy, because of connecting from browser)
 */
var cushion = function(host, port, username, password, additional) {
  additional = additional || {};

  this._methodMatch = /^GET|PUT|POST|DELETE|HEAD|COPY$/i;
  this._options = {
    'host': host || defaultOptions.host,
    'port': port || defaultOptions.port,
    'username': username || defaultOptions.username,
    'password': password || defaultOptions.password,
    'secure': additional.secure || defaultOptions.secure,
    'path': (additional.path) ? additional.path + '/' : defaultOptions.path
  };

  if (this._options.secure === true) {
    http = require('https');
  }
};


/**
 * returns a list of active tasks
 *
 * @param {function(error, activeTasks)} callback function that will called,
 *     after getting the list of active tasks or if there was an error
 */
cushion.prototype.activeTasks = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_active_tasks',
    'callback': callback
  });
};


/**
 * set or get configuration params
 * if you set:
 *   one param: you will get the complete configuration
 *   two params: you will get all options of the specific section
 *   three params: you will get the content of the specific option
 *   four params: you set a specific option to the new value, or you delete the
 *                given option, if you set value to null
 *
 * @param {string|function(error, configuration)} sectionOrCallback a section of
 *     different config params or function that will be called, after getting
 *     the whole configuration or if there was an error
 * @param {?string|function(error, options)} optionOrCallback an specific option
 *     or a function, that will be called, after getting the options of the
 *     section of if there was an error
 * @param {?string|function(error, value)} valueOrCallback the new value for the
 *     option or function that will be called, after getting the content of the
 *     option; if you set the value to null, option will be deleted
 * @param {?function(error, saved)} callback function that will be called after
 *     saving the new value, or if there was an error
 */
cushion.prototype.config = function(
  sectionOrCallback,
  optionOrCallback,
  valueOrCallback,
  callback
) {
  var section = (typeof(sectionOrCallback) === 'string') ?
        sectionOrCallback :
        null,
      option = (typeof(optionOrCallback) === 'string') ?
        optionOrCallback :
        null,
      value = (
        typeof(valueOrCallback) === 'string' ||
        typeof(valueOrCallback) === 'number' ||
        valueOrCallback === null
      ) ? valueOrCallback : undefined,
      options;
  callback = callback ||
    valueOrCallback ||
    optionOrCallback ||
    sectionOrCallback;

  options = {
    'method': (value !== undefined) ?
      ((value === null) ? 'DELETE' : 'PUT') :
      'GET',
    'path': '_config' +
      ((section) ? '/' + section : '') +
      ((option) ? '/' + option : ''),
    'callback': function(error, response) {
      if (error) {
        response = null;
      } else {
        response = (value !== undefined) ? true : response;
      }

      callback(error, response);
    }
  };

  // do we set a new value?
  if (typeof(value) === 'string' || typeof(value) === 'number') {
    options.body = '"' + value + '"';
  }

  this.request(options);
};


/**
 * creates an admin
 *
 * @param {string} name name of the admin account
 * @param {string} password password of the admin account
 * @param {function(error, created)} callback function that will be called after
 *     creating the admin account, or if there was an error
 */
cushion.prototype.createAdmin = function(name, password, callback) {
  // first we have to create a new option at the config
  this.config('admins', name, password, (function(error, created) {
    // after that we have to create a user document
    var database,
        document;

    if (created === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.body('name', name);
      document.body('type', 'user');
      document.body('roles', []);
      document.save(function(error, document) {
        if (error) {
          callback(error, null);
        } else {
          callback(error, true);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * gives a connection to a specific database
 *
 * @param {string} name name of the database
 * @return {Object} the database object
 */
cushion.prototype.database = function(name) {
  return new Database(name, this);
};


/**
 * deletes an admin
 *
 * @param {string} name username of the admin
 * @param {function(error, deleted)} callback function that will be called,
 *     after deleting the admin account, or if there was an error
 */
cushion.prototype.deleteAdmin = function(name, callback) {
  // first we have to delete the admin option
  this.config('admins', name, null, (function(error, deleted) {
    // after that we have to delete the user document
    var database,
        document;

    if (deleted === true) {
      database = this.database('_users');
      document = database.document('org.couchdb.user:' + name);
      document.load(function(error, document) {
        if (document) {
          document.destroy(function(error, document) {
            if (document) {
              callback(null, true);
            } else {
              callback(error, null);
            }
          });
        } else {
          callback(error, null);
        }
      });
    } else {
      callback(error, null);
    }
  }).bind(this));
};


/**
 * retrieving a list of databases
 *
 *
 * @param {boolean|function(error, databases)} noCouchRelatedOrCallback filters
 *     all couch related databases, so the list has only databases which a user
 *     has set up or function that will be called after retrieving a list of
 *     databases, or if there was an error
 * @param {?function()} callback function that will be called after retrieving a
 *     list of databases, or if there was an error
 */

cushion.prototype.listDatabases = function(noCouchRelatedOrCallback, callback) {
  var noCouchRelated = (callback) ? noCouchRelatedOrCallback : null;
  callback = callback || noCouchRelatedOrCallback;

  this.request({
    'method': 'GET',
    'path': '_all_dbs',
    'callback': (function (error, response) {
      if (error === null && response !== null) {
        // filter couch related databases, if user want's so
        if (noCouchRelated === true) {
          response = response.filter(function(dbName, index, list) {
            return (dbName[0] !== '_');
          });
        }

        // create database objects
        response = response.map(function(dbName) {
          return this.database(dbName);
        }, this);
      }

      callback(error, response);
    }).bind(this)
  });
};


/**
 * returns the tail of the server's log file
 *
 * @param {number|function(error, log)} bytesOrCallback number of bytes how many
 *     do you want from the tail or function that will be called, after getting
 *     the log or if there was an error
 * @param {?function(error, log)} callback function that will be called, after
 *     getting the log or if there was an error
 */
cushion.prototype.log = function(bytesOrCallback, callback) {
  var bytes = (arguments.length > 1) ? bytesOrCallback : null;
  callback = callback || bytesOrCallback;

  this.request({
    'method': 'GET',
    'path': '_log' + ((bytes) ? '?bytes=' + bytes : ''),
    'callback': callback
  });
};


/**
 * wrapper function for any request to the couchdb
 *
 * @param {Function} callback function that will be called after all data events
 * @param {http.ClientResponse} response the http response object
 */
cushion.prototype._request = function(callback, response) {
  var content = '';

  response.on('data', function(chunk) {
    content += chunk;
  });

  response.on('end', (function() {
    try {
      if (
        response.headers['content-type'] === 'application/json' &&
        content.length > 0
      ) {
        content = JSON.parse(content);
      }

      if (response.statusCode === 404 && content.length === 0) {
        content = {
          'error': 'not_found',
          'reason': 'missing'
        };
      }

      callback(
        (content.error) ? content : null,
        (!content.error) ? content : null,
        response.headers || null
      );
    } catch(error) {
      callback(error, null, null);
    }
  }).bind(this));
};


/**
 * sends a request to the couch
 *
 * @param {object} properties options for the request
 *      method: {string} http method, can be GET, PUT, POST, DELETE, HEAD, COPY
 *      path: {string} uri path after domain
 *      headers: {Object} key/value-pairs of additional http headers
 *      body: {Object|Array} additional body
 *      callback: {function(error, response)} function that will be called,
 *                after getting the response or if there was an error
 */
cushion.prototype.request = function(properties) {
  var options = {
        'host': this._options.host,
        'port': this._options.port,
        'method': (
                    typeof(properties.method) === 'string' &&
                    properties.method.match(this._methodMatch) !== null
                  ) ?
                  properties.method :
                  'GET',
        'path': '/' + this._options.path + (properties.path || ''),
        'auth': this._options.username + ':' + this._options.password,
        'headers': properties.headers || {}
      },
      request;

  // make sure, that we get application/json response from couchdb
  options.headers.Accept = options.headers.Accept || '*/*,application/json';
  options.headers['Content-Type'] = options.headers['Content-Type'] ||
    'application/json';

  // set up request object
  request = http.request(
    options,
    this._request.bind(this, properties.callback)
  );

  // define callback, if there is an error
  request.on('error', (function(error) {
    properties.callback(error, null, null);
  }).bind(this));

  // adding optional body to the request
  if (properties.body) {
    if (typeof(properties.body) === 'object') {
      request.write(JSON.stringify(properties.body));
    } else {
      request.write(properties.body);
    }
  }

  // starting request
  request.end();
};


/**
 * restarts the couchdb
 *
 * @param {function(error, restart)} callback function that will be called,
 *     after initializing the restart or if there was an error
 */
cushion.prototype.restart = function(callback) {
  this.request({
    'method': 'POST',
    'path': '_restart',
    'callback': function(error, restart) {
      if (error && error.code === 'ECONNRESET') {
        error = null;
        restart = true;
      }

      callback(error, restart);
    }
  });
};


/**
 * returns server statistics
 *
 * @param {function(error, stats)} callback function that will be called, after
 *     getting the statistics of if there was an error
 */
cushion.prototype.stats = function(callback) {
  this.request({
    'method': 'GET',
    'path': '_stats',
    'callback': callback
  });
};


/**
 * get the user object
 *
 * @return {cushion.User} the user object
 */
cushion.prototype.user = function() {
  return new UserApi(this);
};


/**
 * returns a list of generated uuids
 *
 * @param {number|function(error, uuidList)} countOrCallback number of uuids to
 *     generate or function that will be called, after getting the list of uuids
 *     or if there was an error
 * @param {?function(error, uuidList)} callback function that will be called,
 *     after getting the list of uuids or if there was an error
 */
cushion.prototype.uuids = function(countOrCallback, callback) {
  var count = (arguments.length > 1) ? countOrCallback : null;
  callback = callback || countOrCallback;

  this.request({
    'method': 'GET',
    'path': '_uuids' + ((count) ? '?count=' + count : ''),
    'callback': function(error, uuidList) {
      if (uuidList) {
        uuidList = uuidList.uuids;
      }

      callback(error, uuidList);
    }
  });
};


/**
 * gets the version of the couchdb
 *
 * @param {Function(version)} callback function that will be called after
 */
cushion.prototype.version = function(callback) {
  this.request({
    'method': 'GET',
    'path': '',
    'callback': function(error, response) {
      if (response !== null) {
        response = response.version;
      }

      callback(error, response);
    }
  });
};


exports.Connection = cushion;

});
window.cushion = require("/cushion.js");
})();
