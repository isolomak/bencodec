import * as assert from 'assert';
import { decode, BencodeDecodeError, BencodeErrorCode } from '../src/index';

describe('Bencode decoder tests', () => {
	test('should throw BencodeDecodeError with EMPTY_INPUT code if data to decode is not provided', () => {
		// @ts-ignore - for testing purposes
		expect(() => decode()).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode(null)).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode(undefined)).toThrow(BencodeDecodeError);

		try {
			// @ts-ignore - for testing purposes
			decode(undefined);
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeDecodeError);
			expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.EMPTY_INPUT);
			expect((error as BencodeDecodeError).position).toBeUndefined();
		}
	});

	test('should throw BencodeDecodeError with INVALID_FORMAT code for invalid data', () => {
		expect(() => decode('asd')).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode(42)).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode([ 42 ])).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode({ baz: 42 })).toThrow(BencodeDecodeError);
		// @ts-ignore - for testing purposes
		expect(() => decode(() => { })).toThrow(BencodeDecodeError);

		try {
			decode('asd');
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeDecodeError);
			expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.INVALID_FORMAT);
			expect((error as BencodeDecodeError).position).toBe(0);
		}

		// Test with non-printable character (triggers hex formatting in error message)
		try {
			decode(Buffer.from([ 0x01 ])); // SOH character (non-printable)
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeDecodeError);
			expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.INVALID_FORMAT);
			expect((error as BencodeDecodeError).message).toContain('0x01');
		}
	});

	test('should throw BencodeDecodeError with UNEXPECTED_END code on unexpected end of data', () => {
		// List without end marker
		expect(() => decode('li42')).toThrow('Unexpected end of data');
		// Dictionary without end marker
		expect(() => decode('d3:foo')).toThrow('Unexpected end of data');
		// Integer without end marker
		expect(() => decode('i42')).toThrow('Unexpected end of data');
		// Integer with invalid terminator
		expect(() => decode('i42x')).toThrow('Unexpected end of data');
		// Nested list without end marker
		expect(() => decode('lli1e')).toThrow('Unexpected end of data');
		// Nested dictionary without end marker
		expect(() => decode('d1:ad1:bi1e')).toThrow('Unexpected end of data');
		// String length exceeds buffer
		expect(() => decode('100:abc')).toThrow('Unexpected end of data');

		try {
			decode('li42');
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeDecodeError);
			expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.UNEXPECTED_END);
			expect((error as BencodeDecodeError).position).toBeDefined();
		}
	});

	describe('Buffer tests', () => {
		test('should decode buffered string', () => {
			const result = decode(Buffer.from('0:'));
			assert.deepStrictEqual(result, Buffer.from(''));
		});

		test('should decode buffered number', () => {
			const result = decode(Buffer.from('i42e'));
			assert.deepStrictEqual(result, 42);
		});
	});

	describe('String tests', () => {
		test('should decode empty string', () => {
			const result = decode('0:');
			assert.deepStrictEqual(result, Buffer.from(''));
		});

		test('should handle malformed string without delimiter', () => {
			// Malformed input without ':' - parser reads number then bytes from current position
			const result = decode('4spam');
			assert.deepStrictEqual(result, Buffer.from('spam'));
		});

		test('should decode string', () => {
			const result = decode('4:spam');
			assert.deepStrictEqual(result, Buffer.from('spam'));
		});

		test('should decode string with stringify option', () => {
			const result = decode('4:spam', { stringify: true });
			assert.deepStrictEqual(result, 'spam');
		});

		test('should decode string with custom encoding', () => {
			// Test latin1 encoding preserves high bytes
			const binaryData = Buffer.from([ 0xB4, 0xFF, 0x80, 0x00 ]);
			const encoded = Buffer.concat([ Buffer.from('4:'), binaryData ]);
			const result = decode(encoded, { stringify: true, encoding: 'latin1' }) as string;
			const resultBuffer = Buffer.from(result, 'latin1');
			assert.deepStrictEqual(resultBuffer, binaryData);
		});

		test('should default to utf8 encoding when not specified', () => {
			const result = decode('4:spam', { stringify: true });
			assert.strictEqual(result, 'spam');
		});

		test('should support hex encoding', () => {
			const result = decode('4:spam', { stringify: true, encoding: 'hex' });
			assert.strictEqual(result, '7370616d');
		});
	});

	describe('Integer tests', () => {
		test('should decode integer', () => {
			const result = decode('i42e');
			assert.strictEqual(result, 42);
		});

		test('should decode negative integer', () => {
			const result = decode('i-42e');
			assert.strictEqual(result, -42);
		});

		test('should decode integer with plus sign', () => {
			const result = decode('i+42e');
			assert.strictEqual(result, 42);
		});

		test('should decode zero', () => {
			const result = decode('i0e');
			assert.strictEqual(result, 0);
		});

		test('should throw BencodeDecodeError with NEGATIVE_ZERO code for negative zero', () => {
			expect(() => decode('i-0e')).toThrow('Invalid bencode: negative zero is not allowed');

			try {
				decode('i-0e');
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.NEGATIVE_ZERO);
			}
		});

		test('should throw BencodeDecodeError with LEADING_ZEROS code for leading zeros', () => {
			expect(() => decode('i03e')).toThrow('Invalid bencode: leading zeros are not allowed');
			expect(() => decode('i007e')).toThrow('Invalid bencode: leading zeros are not allowed');
			expect(() => decode('i-03e')).toThrow('Invalid bencode: leading zeros are not allowed');

			try {
				decode('i03e');
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.LEADING_ZEROS);
				expect((error as BencodeDecodeError).position).toBe(1);
			}
		});

		test('should decode float as int', () => {
			const result = decode('i42.2e');
			assert.strictEqual(result, 42);
		});

		test('should decode negative float as int', () => {
			const result = decode('i-42.2e');
			assert.strictEqual(result, -42);
		});

		test('should truncate float toward zero (not round)', () => {
			// 42.5 truncates to 42 (not 43)
			assert.strictEqual(decode('i42.5e'), 42);
			// 42.9 truncates to 42 (not 43)
			assert.strictEqual(decode('i42.9e'), 42);
			// -42.5 truncates to -42 (not -43)
			assert.strictEqual(decode('i-42.5e'), -42);
			// -42.9 truncates to -42 (not -43)
			assert.strictEqual(decode('i-42.9e'), -42);
		});
	});

	describe('List tests', () => {
		test('should decode empty list', () => {
			const result = decode('le') as Array<any>;
			assert.deepStrictEqual(result, []);
		});

		test('should decode list of strings', () => {
			const result = decode('l4:spam3:bare') as Array<any>;
			assert.deepStrictEqual(result, [ Buffer.from('spam'), Buffer.from('bar') ]);
		});

		test('should decode list of integers', () => {
			const result = decode('li42ei-42ei42.2ei-42.2ei0ee') as Array<any>;
			assert.deepStrictEqual(result, [
				42, -42, 42, -42, 0,
			]);
		});

		test('should decode list with string and integer', () => {
			const result = decode('l4:spami42ee') as Array<any>;
			assert.deepStrictEqual(result, [ Buffer.from('spam'), 42 ]);
		});

		test('should decode list of lists with integers and strings', () => {
			const result = decode('ll4:spam3:bareli42ei-42ei42.2ei-42.2ei0eee') as Array<any>;

			assert.deepStrictEqual(result, [
				[ Buffer.from('spam'), Buffer.from('bar') ],
				[
					42, -42, 42, -42, 0,
				],
			]);
		});

		test('should decode list of dictionaries with integers and strings', () => {
			const result = decode('ld3:foo4:spam3:bari42eed3:baz4:test3:vazi-42eee') as Array<any>;

			assert.deepStrictEqual(result, [
				{ foo: Buffer.from('spam'), bar: 42 },
				{ baz: Buffer.from('test'), vaz: -42 },
			]);
		});
	});

	describe('Dictionary tests', () => {
		test('should decode empty dictionary', () => {
			const result = decode('de');
			assert.deepStrictEqual(result, { });
		});

		test('should decode dictionary with string', () => {
			const result = decode('d3:bar4:spame');
			assert.deepStrictEqual(result, { bar: Buffer.from('spam') });
		});

		test('should decode dictionary with integer', () => {
			const result = decode('d3:bari42ee');
			assert.deepStrictEqual(result, { bar: 42 });
		});

		test('should decode dictionary with string and integer', () => {
			const result = decode('d3:foo4:spam3:bari42ee');
			assert.deepStrictEqual(result, { foo: Buffer.from('spam'), bar: 42 });
		});

		test('should decode dictionary with list', () => {
			const result = decode('d3:barl4:spami42eee');
			assert.deepStrictEqual(result, { bar: [ Buffer.from('spam'), 42 ] });
		});

		test('should decode dictionary with dictionary', () => {
			const result = decode('d3:bard3:cow4:spamee');
			assert.deepStrictEqual(result, { bar: { cow: Buffer.from('spam') } });
		});
	});

	describe('Strict mode tests', () => {
		test('should accept correctly sorted dictionary keys in strict mode', () => {
			// Keys 'a', 'b', 'c' are in sorted order
			const result = decode('d1:ai1e1:bi2e1:ci3ee', { strict: true });
			assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
		});

		test('should throw BencodeDecodeError with UNSORTED_KEYS code for unsorted dictionary keys in strict mode', () => {
			// Keys 'b', 'a' are not in sorted order
			expect(() => decode('d1:bi1e1:ai2ee', { strict: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');

			try {
				decode('d1:bi1e1:ai2ee', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.UNSORTED_KEYS);
			}
		});

		test('should throw BencodeDecodeError with UNSORTED_KEYS code for duplicate dictionary keys in strict mode', () => {
			// Duplicate key 'a'
			expect(() => decode('d1:ai1e1:ai2ee', { strict: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');

			try {
				decode('d1:ai1e1:ai2ee', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.UNSORTED_KEYS);
			}
		});

		test('should accept unsorted dictionary keys without strict mode', () => {
			// Keys 'b', 'a' are not in sorted order, but strict mode is off
			const result = decode('d1:bi1e1:ai2ee');
			assert.deepStrictEqual(result, { b: 1, a: 2 });
		});

		test('should validate nested dictionary key order in strict mode', () => {
			// Outer keys sorted, inner keys unsorted
			expect(() => decode('d1:ad1:bi1e1:ai2eee', { strict: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');
		});

		test('should validate key order with stringify option in strict mode', () => {
			// Keys 'b', 'a' are not in sorted order, with stringify enabled
			expect(() => decode('d1:bi1e1:ai2ee', { strict: true, stringify: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');
		});

		test('should throw BencodeDecodeError with TRAILING_DATA code for trailing data after integer in strict mode', () => {
			expect(() => decode('i42ei99e', { strict: true }))
				.toThrow('Invalid bencode: unexpected data after valid bencode');

			try {
				decode('i42ei99e', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.TRAILING_DATA);
				// position is undefined for trailing data errors
				expect((error as BencodeDecodeError).position).toBeUndefined();
			}
		});

		test('should throw BencodeDecodeError with TRAILING_DATA code for trailing data after string in strict mode', () => {
			expect(() => decode('4:spamextra', { strict: true }))
				.toThrow('Invalid bencode: unexpected data after valid bencode');

			try {
				decode('4:spamextra', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.TRAILING_DATA);
			}
		});

		test('should throw BencodeDecodeError with TRAILING_DATA code for trailing data after list in strict mode', () => {
			expect(() => decode('li1eei2e', { strict: true }))
				.toThrow('Invalid bencode: unexpected data after valid bencode');

			try {
				decode('li1eei2e', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.TRAILING_DATA);
			}
		});

		test('should throw BencodeDecodeError with TRAILING_DATA code for trailing data after dictionary in strict mode', () => {
			expect(() => decode('d1:ai1eei2e', { strict: true }))
				.toThrow('Invalid bencode: unexpected data after valid bencode');

			try {
				decode('d1:ai1eei2e', { strict: true });
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeDecodeError);
				expect((error as BencodeDecodeError).code).toBe(BencodeErrorCode.TRAILING_DATA);
			}
		});

		test('should ignore trailing data without strict mode', () => {
			const result = decode('i42ei99e');
			assert.strictEqual(result, 42);
		});
	});
});
