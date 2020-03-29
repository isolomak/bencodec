import * as assert from 'assert';
import encode from '../lib/encode';

describe('Bencode encoder test', () => {

	describe('String test', () => {

		test('should encode empty string', function () {
			const result = encode('');
			assert.deepStrictEqual(result, Buffer.from('0:'));
		});

		test('should encode string', function () {
			const result = encode('spam');
			assert.deepStrictEqual(result, Buffer.from('4:spam'));
		});

	});

	describe('Integer test', () => {

		test('should encode integer', function () {
			const result = encode(42);
			assert.deepStrictEqual(result, Buffer.from('i42e'));
		});

		test('should encode negative integer', function () {
			const result = encode(-42);
			assert.deepStrictEqual(result, Buffer.from('i-42e'));
		});

		test('should encode zero', function () {
			const result = encode(0);
			assert.deepStrictEqual(result, Buffer.from('i0e'));
		});

		test('should encode negative zero', function () {
			const result = encode(-0);
			assert.deepStrictEqual(result, Buffer.from('i0e'));
		});

		test('should encode float as int', function () {
			const result = encode(42.2);
			assert.deepStrictEqual(result, Buffer.from('i42e'));
		});

		test('should encode negative float as int', function () {
			const result = encode(-42.2);
			assert.deepStrictEqual(result, Buffer.from('i-42e'));
		});

	});

	describe('List test', () => {

		test('should encode empty list', function () {
			const result = encode([]);
			assert.deepStrictEqual(result, Buffer.from('le'));
		});

		test('should encode list of strings', function () {
			const result = encode([ 'spam', 'bar' ]);
			assert.deepStrictEqual(result, Buffer.from('l4:spam3:bare'));
		});

		test('should encode list of integers', function () {
			const result = encode([ 42, -42, 42.2, -42.2, 0, -0 ]);
			assert.deepStrictEqual(result, Buffer.from('li42ei-42ei42ei-42ei0ei0ee'));
		});

		test('should encode list with string and integer', function () {
			const result = encode([ 'spam', 42 ]);
			assert.deepStrictEqual(result, Buffer.from('l4:spami42ee'));
		});

		test('should encode list of lists with integers and strings', function () {
			const result = encode([ [ 'spam', 'bar' ], [ 42, -42, 42.2, -42.2, 0, -0 ] ]);
			assert.deepStrictEqual(result, Buffer.from('ll4:spam3:bareli42ei-42ei42ei-42ei0ei0eee'));
		});

		test('should encode list of dictionaries with integers and strings', function () {
			const result = encode([ { foo: 'spam', bar: 42 }, { baz: 'cow', vaz: -42 } ]);
			assert.deepStrictEqual(result, Buffer.from('ld3:bari42e3:foo4:spamed3:baz3:cow3:vazi-42eee'));

		});

	});

	describe('Dictionary test', () => {

		test('should encode empty dictionary', function () {
			const result = encode({});
			assert.deepStrictEqual(result, Buffer.from('de'));
		});

		test('should encode dictionary with string', function () {
			const result = encode({ bar: 'spam' });
			assert.deepStrictEqual(result, Buffer.from('d3:bar4:spame'));
		});

		test('should encode dictionary with integer', function () {
			const result = encode({ bar: 42 });
			assert.deepStrictEqual(result, Buffer.from('d3:bari42ee'));
		});

		test('should encode dictionary with string and integer', function () {
			const result = encode({ foo: 'spam',  bar: 42 });
			assert.deepStrictEqual(result, Buffer.from('d3:bari42e3:foo4:spame'));
		});

		test('should encode dictionary with list', function () {
			const result = encode({ bar: [ 'spam', 42 ] });
			assert.deepStrictEqual(result, Buffer.from('d3:barl4:spami42eee'));
		});

		test('should encode dictionary with dictionary', function () {
			const result = encode({ bar: { cow: 'spam' } });
			assert.deepStrictEqual(result, Buffer.from('d3:bard3:cow4:spamee'));
		});

	});

});
