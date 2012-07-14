default: test

#
# Run all tests
#
test:
	mocha --reporter nyan test/testrunner.js

#
# Run jshint
#
jshint:
	jshint *.js --config .jshintrc

.PHONY: test