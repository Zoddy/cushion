default: test

#
# Run all tests
#
test:
	vows test/connection-test.js --spec

.PHONY: test