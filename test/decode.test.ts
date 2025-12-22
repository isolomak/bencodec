import * as assert from 'assert';
import { decode } from '../src/index';

describe('Bencode decoder tests', () => {
	test('should throw error if data to decode is not provided', () => {
		// @ts-ignore - for testing purposes
		expect(() => decode()).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode(null)).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode(undefined)).toThrow(Error);
	});

	test('should throw error if invalid data to decode is provided', () => {
		expect(() => decode('asd')).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode(42)).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode([ 42 ])).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode({ baz: 42 })).toThrow(Error);
		// @ts-ignore - for testing purposes
		expect(() => decode(() => { })).toThrow(Error);
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

		test('should throw error for negative zero', () => {
			expect(() => decode('i-0e')).toThrow('Invalid bencode: negative zero is not allowed');
		});

		test('should throw error for leading zeros', () => {
			expect(() => decode('i03e')).toThrow('Invalid bencode: leading zeros are not allowed');
			expect(() => decode('i007e')).toThrow('Invalid bencode: leading zeros are not allowed');
			expect(() => decode('i-03e')).toThrow('Invalid bencode: leading zeros are not allowed');
		});

		test('should decode float as int', () => {
			const result = decode('i42.2e');
			assert.strictEqual(result, 42);
		});

		test('should decode negative float as int', () => {
			const result = decode('i-42.2e');
			assert.strictEqual(result, -42);
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

		test('should throw error for unsorted dictionary keys in strict mode', () => {
			// Keys 'b', 'a' are not in sorted order
			expect(() => decode('d1:bi1e1:ai2ee', { strict: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');
		});

		test('should throw error for duplicate dictionary keys in strict mode', () => {
			// Duplicate key 'a'
			expect(() => decode('d1:ai1e1:ai2ee', { strict: true }))
				.toThrow('Invalid bencode: dictionary keys must be in sorted order');
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
	});
});
