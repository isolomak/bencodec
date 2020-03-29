import * as assert from 'assert';
import decode from '../lib/decode';

describe('Bencode decoder test', () => {

    describe('String test', () => {

        test('should decode empty string', function () {
            const result = decode('0:');
            assert.deepStrictEqual(result, Buffer.from(''));
        });

        test('should decode string', function () {
            const result = decode('4:spam');
            assert.deepStrictEqual(result, Buffer.from('spam'));
        });

    });

    describe('Integer test', () => {

        test('should decode integer', function () {
            const result = decode('i42e');
            assert.strictEqual(result, 42);
        });

        test('should decode negative integer', function () {
            const result = decode('i-42e');
            assert.strictEqual(result, -42);
        });

        test('should decode zero', function () {
            const result = decode('i0e');
            assert.strictEqual(result, 0);
        });

        test('should decode negative zero', function () {
            const result = decode('i-0e');
            assert.strictEqual(result, -0);
        });

        test('should decode float as int', function () {
            const result = decode('i42.2e');
            assert.strictEqual(result, 42);
        });

        test('should decode negative float as int', function () {
            const result = decode('i-42.2e');
            assert.strictEqual(result, -42);
        });

    });

    describe('List test', () => {

        test('should decode empty list', function () {
            const result = decode('le') as Array<any>;
            assert.deepStrictEqual(result, []);
        });

        test('should decode list of strings', function () {
            const result = decode('l4:spam3:bare') as Array<any>;
            assert.deepStrictEqual(result, [ Buffer.from('spam'), Buffer.from('bar') ]);
        });

        test('should decode list of integers', function () {
            const result = decode('li42ei-42ei42.2ei-42.2ei0ei-0ee') as Array<any>;
            assert.deepStrictEqual(result, [ 42, -42, 42, -42, 0, -0 ]);
        });

        test('should decode list with string and integer', function () {
            const result = decode('l4:spami42ee') as Array<any>;
            assert.deepStrictEqual(result, [ Buffer.from('spam'), 42 ]);
        });

        test('should decode list of lists with integers and strings', function () {
            const result = decode('ll4:spam3:bareli42ei-42ei42.2ei-42.2ei0ei-0eee') as Array<any>;

            assert.deepStrictEqual(result, [
                [ Buffer.from('spam'), Buffer.from('bar') ],
                [ 42, -42, 42, -42, 0, -0 ],
            ]);
        });

        test('should decode list of dictionaries with integers and strings', function () {
            const result = decode('ld3:foo4:spam3:bari42eed3:baz4:test3:vazi-42eee') as Array<any>;

            assert.deepStrictEqual(result, [
                { foo: Buffer.from('spam'),  bar: 42 },
                { baz: Buffer.from('test'),  vaz: -42 },
            ]);

        });

    });

    describe('Dictionary test', () => {

        test('should decode empty dictionary', function () {
            const result = decode('de');
            assert.deepStrictEqual(result, {});
        });

        test('should decode dictionary with string', function () {
            const result = decode('d3:bar4:spame');
            assert.deepStrictEqual(result, { bar: Buffer.from('spam') });
        });

        test('should decode dictionary with integer', function () {
            const result = decode('d3:bari42ee');
            assert.deepStrictEqual(result, { bar: 42 });
        });

        test('should decode dictionary with string and integer', function () {
            const result = decode('d3:foo4:spam3:bari42ee');
            assert.deepStrictEqual(result, { foo: Buffer.from('spam'),  bar: 42 });
        });

        test('should decode dictionary with list', function () {
            const result = decode('d3:barl4:spami42eee');
            assert.deepStrictEqual(result, { bar: [ Buffer.from('spam'), 42 ] });
        });

        test('should decode dictionary with dictionary', function () {
            const result = decode('d3:bard3:cow4:spamee');
            assert.deepStrictEqual(result, { bar: { cow: Buffer.from('spam') } });
        });

    });


});
