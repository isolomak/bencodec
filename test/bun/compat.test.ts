import { expect, test, describe } from 'bun:test';

import { encode, decode, BencodeDecodeError, BencodeErrorCode } from '../../lib/index.js';

describe('bencodec Bun compatibility', () => {
	test('encode/decode roundtrip - integer', () => {
		const encoded = encode(42);
		const decoded = decode(encoded);
		expect(decoded).toBe(42);
	});

	test('encode/decode roundtrip - negative integer', () => {
		const encoded = encode(-123);
		const decoded = decode(encoded);
		expect(decoded).toBe(-123);
	});

	test('encode/decode roundtrip - string', () => {
		const encoded = encode('hello');
		const decoded = decode(encoded, { stringify: true });
		expect(decoded).toBe('hello');
	});

	test('encode/decode roundtrip - list', () => {
		const data = [ 1, 2, 3 ];
		const encoded = encode(data);
		const decoded = decode(encoded);
		expect(decoded).toEqual(data);
	});

	test('encode/decode roundtrip - dictionary', () => {
		const data = { foo: 'bar', num: 42 };
		const encoded = encode(data, { stringify: true });
		const decoded = decode(encoded, { stringify: true });
		expect(decoded).toEqual(data);
	});

	test('encode/decode roundtrip - nested structure', () => {
		const data = {
			list: [ 1, 2, 3 ],
			nested: { a: 'b' },
			value: 42,
		};
		const encoded = encode(data, { stringify: true });
		const decoded = decode(encoded, { stringify: true });
		expect(decoded).toEqual(data);
	});

	test('encode returns Uint8Array by default', () => {
		const result = encode(42);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test('encode with stringify option returns string', () => {
		const result = encode(42, { stringify: true });
		expect(typeof result).toBe('string');
		expect(result).toBe('i42e');
	});

	test('decode throws on invalid input', () => {
		expect(() => decode('invalid')).toThrow(BencodeDecodeError);
	});

	test('BencodeErrorCode enum is accessible', () => {
		expect(typeof BencodeErrorCode.INVALID_FORMAT).toBe('string');
		expect(typeof BencodeErrorCode.EMPTY_INPUT).toBe('string');
		expect(typeof BencodeErrorCode.UNEXPECTED_END).toBe('string');
	});
});
