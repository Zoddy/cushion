// jshint settings
/*global exports: false, require: false*/

/**
 * Connection tests
 *
 *  1) get version
 *  2) list of active tasks
 *  3) get complete config
 *  4) get config section
 *  5) get config option
 *  6) set config option to new value
 *  7) delete config option
 *  8) create admin
 *  9) delete admin
 * 10) create user
 * 11) add role to user
 * 12) adding two roles to user
 * 13) getting list of roles
 * 14) delete role from user
 * 15) delete two roles from user
 * 16) change password of user
 * 17) delete user
 * 18) generate uuid
 * 19) generate three uuids
 * 20) get statistics
 * 21) get log
 * 22) get log with specific length of 500
 * 23) get list of databases
 * 24) get list of databases without couchdb related
 */

var expect = require('chai').expect,
    config = require('./config.js');

exports.tests = [{
  'message': 'get version',
  'callpath': 'connection.version',
  'url': ['GET', ''],
  'callback': function(error, version) {
    expect(version).to.be.a('string').and.to.match(/^\d\.\d\.\d$/);
  }
}, {
  'message': 'list of active tasks',
  'callpath': 'connection.activeTasks',
  'url': ['GET', '_active_tasks'],
  'callback': function(error, activeTasks) {
    expect(activeTasks).to.be.an('array');
  }
}, {
  'message': 'get complete config',
  'callpath': 'connection.config',
  'url': ['GET', '_config'],
  'callback': function(error, config) {
    expect(config).to.be.an('object');
    expect(config.admins).to.be.an('object');
  }
}, {
  'message': 'get config section',
  'callpath': 'connection.config',
  'arguments': ['admins'],
  'url': ['GET', '_config/admins'],
  'callback': function(error, section) {
    expect(section).to.be.an('object').and.to.have.property(config.username);
  }
}, {
  'message': 'get config option',
  'callpath': 'connection.config',
  'arguments': ['admins', config.username],
  'url': ['GET', '_config/admins/' + config.username],
  'callback': function(error, option) {
    expect(option).to.be.a('string').and.to.have.string('-hashed-');
  }
}, {
  'message': 'set config option to new value',
  'callpath': 'connection.config',
  'arguments': ['foo', 'bar', 'foobar'],
  'url': ['PUT', '_config/foo/bar', '"foobar"'],
  'callback': function(error, saved) {
    expect(saved).to.be.a('boolean').and.to.be.true;
  }
}, {
  'message': 'delete config option',
  'callpath': 'connection.config',
  'arguments': ['foo', 'bar', null],
  'url': ['DELETE', '_config/foo/bar'],
  'callback': function(error, deleted) {
    expect(deleted).to.be.a('boolean').and.to.be.true;
  }
}, {
  'message': 'create admin',
  'callpath': 'connection.createAdmin',
  'arguments': ['cushion_test_admin', 'cushion_test_password'],
  'callback': function(error, created) {
    expect(created).to.be.true;
  }
}, {
  'message': 'delete admin',
  'callpath': 'connection.deleteAdmin',
  'arguments': ['cushion_test_admin'],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'create user',
  'callpath': 'user.create',
  'arguments': ['cushion_test_user', 'cushion_test_password'],
  'callback': function(error, created) {
    expect(created).to.be.true;
  }
}, {
  'message': 'add role to user',
  'callpath': 'user.addRole',
  'arguments': ['cushion_test_user', 'foo'],
  'callback': function(error, added) {
    expect(added).to.be.true;
  }
}, {
  'message': 'adding two roles to user',
  'callpath': 'user.addRole',
  'arguments': ['cushion_test_user', ['bar', 'baz']],
  'callback': function(error, added) {
    expect(added).to.be.true;
  }
}, {
  'message': 'getting list of roles',
  'callpath': 'user.getRoles',
  'arguments': ['cushion_test_user'],
  'callback': function(error, roles) {
    expect(roles).to.be.an('array').and.to.deep.equal(['foo', 'bar', 'baz']);
  }
}, {
  'message': 'delete role from user',
  'callpath': 'user.deleteRole',
  'arguments': ['cushion_test_user', 'foo'],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'delete two roles from user',
  'callpath': 'user.deleteRole',
  'arguments': ['cushion_test_user', ['bar', 'baz']],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'change password of user',
  'callpath': 'user.password',
  'arguments': ['cushion_test_user', 'cushion_test_password'],
  'callback': function(error, changed) {
    expect(changed).to.be.true;
  }
}, {
  'message': 'delete user',
  'callpath': 'user.delete',
  'arguments': ['cushion_test_user'],
  'callback': function(error, deleted) {
    expect(deleted).to.be.true;
  }
}, {
  'message': 'generate uuid',
  'callpath': 'connection.uuids',
  'url': ['GET', '_uuids'],
  'callback': function(error, uuid) {
    expect(uuid).to.be.an('array').and.to.have.length(1);
    expect(uuid[0]).to.be.a('string');
  }
}, {
  'message': 'generate three uuids',
  'callpath': 'connection.uuids',
  'arguments': [3],
  'url': ['GET', '_uuids?count=3'],
  'callback': function(error, uuids) {
    expect(uuids).to.be.an('array').and.to.have.length(3);
    expect(uuids[0]).to.be.a('string');
  }
}, {
  'message': 'get statistics',
  'callpath': 'connection.stats',
  'url': ['GET', '_stats'],
  'callback': function(error, stats) {
    expect(stats).to.be.an('object');
  }
}, {
  'message': 'get log',
  'callpath': 'connection.log',
  'url': ['GET', '_log'],
  'callback': function(error, log) {
    expect(log).to.be.a('string');
    expect(log.length).to.be.below(1001);
  }
}, {
  'message': 'get log with specific length of 500',
  'callpath': 'connection.log',
  'arguments': [500],
  'url': ['GET', '_log?bytes=500'],
  'callback': function(error, log) {
    expect(log).to.be.a('string');
    expect(log.length).to.be.below(501);
  }
}, {
  'message': 'get list of databases',
  'callpath': 'connection.listDatabases',
  'url': ['GET', '_all_dbs'],
  'callback': function(error, databases) {
    expect(databases).to.be.an('array');
    expect(databases[0]).to.respondTo('name');
    expect(databases[0].name()).to.have.string('_');
  }
}, {
  'message': 'get list of databases without couchdb related',
  'callpath': 'connection.listDatabases',
  'arguments': [true],
  'url': ['GET', '_all_dbs'],
  'callback': function(error, databases) {
    expect(databases).to.be.an('array');
    expect(databases[0]).to.respondTo('name');

    databases.forEach(function(database, index, databases) {
      expect(database.name()).to.not.match(/^_/);
    });
  }
}];