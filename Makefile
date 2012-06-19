default: test

#
# Run all tests
#
test:
	mocha --reporter nyan test/*-test.js

.PHONY: test