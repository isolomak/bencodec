import { assertEquals, assertThrows } from 'jsr:@std/assert';

import { encode, decode, BencodeDecodeError, BencodeErrorCode } from '../../lib/index.js';

Deno.test('encode/decode roundtrip - integer', () => {
	const encoded = encode(42);
	const decoded = decode(encoded);
	assertEquals(decoded, 42);
});

Deno.test('encode/decode roundtrip - negative integer', () => {
	const encoded = encode(-123);
	const decoded = decode(encoded);
	assertEquals(decoded, -123);
});

Deno.test('encode/decode roundtrip - string', () => {
	const encoded = encode('hello');
	const decoded = decode(encoded, { stringify: true });
	assertEquals(decoded, 'hello');
});

Deno.test('encode/decode roundtrip - list', () => {
	const data = [ 1, 2, 3 ];
	const encoded = encode(data);
	const decoded = decode(encoded);
	assertEquals(decoded, data);
});

Deno.test('encode/decode roundtrip - dictionary', () => {
	const data = { foo: 'bar', num: 42 };
	const encoded = encode(data, { stringify: true });
	const decoded = decode(encoded, { stringify: true });
	assertEquals(decoded, data);
});

Deno.test('encode/decode roundtrip - nested structure', () => {
	const data = {
		list: [ 1, 2, 3 ],
		nested: { a: 'b' },
		value: 42,
	};
	const encoded = encode(data, { stringify: true });
	const decoded = decode(encoded, { stringify: true });
	assertEquals(decoded, data);
});

Deno.test('encode returns Uint8Array by default', () => {
	const result = encode(42);
	assertEquals(result instanceof Uint8Array, true);
});

Deno.test('encode with stringify option returns string', () => {
	const result = encode(42, { stringify: true });
	assertEquals(typeof result, 'string');
	assertEquals(result, 'i42e');
});

Deno.test('decode throws on invalid input', () => {
	assertThrows(
		() => decode('invalid'),
		BencodeDecodeError,
	);
});

Deno.test('BencodeErrorCode enum is accessible', () => {
	assertEquals(typeof BencodeErrorCode.INVALID_FORMAT, 'string');
	assertEquals(typeof BencodeErrorCode.EMPTY_INPUT, 'string');
	assertEquals(typeof BencodeErrorCode.UNEXPECTED_END, 'string');
});
