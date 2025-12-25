'use strict';

const { encode, decode, BencodeDecodeError, BencodeEncodeError, BencodeErrorCode } = require('../../lib/index.cjs');

// Test encode/decode roundtrip
const encoded = encode({ test: 42 });
if (!(encoded instanceof Uint8Array)) {
	throw new Error('Expected Uint8Array from encode()');
}

const decoded = decode(encoded);
if (decoded.test !== 42) {
	throw new Error('Decode failed: expected { test: 42 }');
}

// Test string encoding
const strEncoded = encode('hello', { stringify: true });
if (strEncoded !== '5:hello') {
	throw new Error(`String encode failed: expected "5:hello", got "${strEncoded}"`);
}

// Test integer encoding
const intEncoded = encode(42, { stringify: true });
if (intEncoded !== 'i42e') {
	throw new Error(`Integer encode failed: expected "i42e", got "${intEncoded}"`);
}

// Verify error class exports
if (typeof BencodeDecodeError !== 'function') {
	throw new Error('BencodeDecodeError not exported correctly');
}

if (typeof BencodeEncodeError !== 'function') {
	throw new Error('BencodeEncodeError not exported correctly');
}

// Verify error code enum export
if (typeof BencodeErrorCode !== 'object') {
	throw new Error('BencodeErrorCode not exported correctly');
}

if (typeof BencodeErrorCode.INVALID_FORMAT !== 'string') {
	throw new Error('BencodeErrorCode.INVALID_FORMAT not accessible');
}

// Test that decode throws on invalid input
try {
	decode('invalid');
	throw new Error('Expected decode to throw on invalid input');
} catch (error) {
	if (!(error instanceof BencodeDecodeError)) {
		throw new Error('Expected BencodeDecodeError for invalid input');
	}
}

console.log('CJS import test passed');
