import * as assert from 'assert';
import encode from '../lib/encode';

describe('Bencode encoder test', () => {

	test('should throw error if type is not supported', () => {
		expect(() => encode(function () {})).toThrowError(Error);
	});

	describe('Buffer tests', () => {

		test('should encode empty buffer', () => {
			const result = encode(Buffer.from(''));
			assert.deepStrictEqual(result, Buffer.from('0:'));
		});

		test('should encode buffer', () => {
			const result = encode(Buffer.from('spam'));
			assert.deepStrictEqual(result, Buffer.from('4:spam'));
		});

	});

	describe('String tests', () => {

		test('should encode empty string', () => {
			const result = encode('');
			assert.deepStrictEqual(result, Buffer.from('0:'));
		});

		test('should encode string', () => {
			const result = encode('spam');
			assert.deepStrictEqual(result, Buffer.from('4:spam'));
		});

	});

	describe('Boolean tests', () => {

		test('should encode true as 1', () => {
			const result = encode(true);
			assert.deepStrictEqual(result, Buffer.from('i1e'));
		});

		test('should encode false as 0', () => {
			const result = encode(false);
			assert.deepStrictEqual(result, Buffer.from('i0e'));
		});

	});

	describe('ArrayBuffer tests', () => {

		const toArrayBuffer = (buffer: Buffer) => {
			const arrayBuffer = new ArrayBuffer(buffer.length);
			const view = new Uint8Array(arrayBuffer);
			for (let i = 0; i < buffer.length; ++i) {
				view[i] = buffer[i];
			}
			return arrayBuffer;
		};

		test('should encode ArrayBuffer', () => {
			const result = encode(toArrayBuffer(Buffer.from('spam')));
			assert.deepStrictEqual(result, Buffer.from('4:spam'));
		});

		test('should encode DataView', () => {
			const result = encode(new DataView( toArrayBuffer(Buffer.from('spam'))));
			assert.deepStrictEqual(result, Buffer.from('4:spam'));
		});

	});

	describe('Integer tests', () => {

		test('should encode integer', () => {
			const result = encode(42);
			assert.deepStrictEqual(result, Buffer.from('i42e'));
		});

		test('should encode negative integer', () => {
			const result = encode(-42);
			assert.deepStrictEqual(result, Buffer.from('i-42e'));
		});

		test('should encode zero', () => {
			const result = encode(0);
			assert.deepStrictEqual(result, Buffer.from('i0e'));
		});

		test('should encode negative zero', () => {
			const result = encode(-0);
			assert.deepStrictEqual(result, Buffer.from('i0e'));
		});

		test('should encode float as int', () => {
			const result = encode(42.2);
			assert.deepStrictEqual(result, Buffer.from('i42e'));
		});

		test('should encode negative float as int', () => {
			const result = encode(-42.2);
			assert.deepStrictEqual(result, Buffer.from('i-42e'));
		});

	});

	describe('List tests', () => {

		test('should encode empty list', () => {
			const result = encode([]);
			assert.deepStrictEqual(result, Buffer.from('le'));
		});

		test('should encode list of strings', () => {
			const result = encode([ 'spam', 'bar' ]);
			assert.deepStrictEqual(result, Buffer.from('l4:spam3:bare'));
		});

		test('should encode list of integers', () => {
			const result = encode([ 42, -42, 42.2, -42.2, 0, -0 ]);
			assert.deepStrictEqual(result, Buffer.from('li42ei-42ei42ei-42ei0ei0ee'));
		});

		test('should encode list with string and integer', () => {
			const result = encode([ 'spam', 42 ]);
			assert.deepStrictEqual(result, Buffer.from('l4:spami42ee'));
		});

		test('should encode list of lists with integers and strings', () => {
			const result = encode([ [ 'spam', 'bar' ], [ 42, -42, 42.2, -42.2, 0, -0 ] ]);
			assert.deepStrictEqual(result, Buffer.from('ll4:spam3:bareli42ei-42ei42ei-42ei0ei0eee'));
		});

		test('should encode list of dictionaries with integers and strings', () => {
			const result = encode([ { foo: 'spam', bar: 42 }, { baz: 'cow', vaz: -42 } ]);
			assert.deepStrictEqual(result, Buffer.from('ld3:bari42e3:foo4:spamed3:baz3:cow3:vazi-42eee'));
		});

		test('should encode list and skip null and undefined values', () => {
			const result = encode([ null, undefined, 42 ]);
			assert.deepStrictEqual(result, Buffer.from('li42ee'));
		});

	});

	describe('Dictionary tests', () => {

		test('should encode empty dictionary', () => {
			const result = encode({});
			assert.deepStrictEqual(result, Buffer.from('de'));
		});

		test('should encode dictionary with string', () => {
			const result = encode({ bar: 'spam' });
			assert.deepStrictEqual(result, Buffer.from('d3:bar4:spame'));
		});

		test('should encode dictionary with integer', () => {
			const result = encode({ bar: 42 });
			assert.deepStrictEqual(result, Buffer.from('d3:bari42ee'));
		});

		test('should encode dictionary with string and integer', () => {
			const result = encode({ foo: 'spam',  bar: 42 });
			assert.deepStrictEqual(result, Buffer.from('d3:bari42e3:foo4:spame'));
		});

		test('should encode dictionary with list', () => {
			const result = encode({ bar: [ 'spam', 42 ] });
			assert.deepStrictEqual(result, Buffer.from('d3:barl4:spami42eee'));
		});

		test('should encode dictionary with dictionary', () => {
			const result = encode({ bar: { cow: 'spam' } });
			assert.deepStrictEqual(result, Buffer.from('d3:bard3:cow4:spamee'));
		});

		test('should encode dictionary and skip null and undefined values', () => {
			const result = encode({ bar: null, cow: null, baz: 42 });
			assert.deepStrictEqual(result, Buffer.from('d3:bazi42ee'));
		});

	});

});
