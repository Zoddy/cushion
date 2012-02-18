default: test

#
# Run all tests
#
test:
	mocha --reporter list test/*-test.js

.PHONY: test