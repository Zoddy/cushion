default: test

#
# Run all tests
#
test:
	mocha --reporter list test/testrunner.js

#
# Run jshint
#
jshint:
	jshint *.js --config .jshintrc

.PHONY: test
.SILENT: test jshint
