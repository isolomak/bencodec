import * as assert from 'assert';
import { decode } from '../src/bencodec';

describe('Bencode decoder tests', () => {

    test('should throw error if data to decode is not provided', () => {
        // @ts-ignore - for testing purposes
        expect(() => decode()).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode(null)).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode(undefined)).toThrowError(Error);
    });

    test('should throw error if invalid data to decode is provided', () => {
        expect(() => decode('asd')).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode(42)).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode([ 42 ])).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode({ baz: 42 })).toThrowError(Error);
        // @ts-ignore - for testing purposes
        expect(() => decode(function () {})).toThrowError(Error);
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
            const result = decode('4:spam', true);
            assert.deepStrictEqual(result, 'spam');
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

        test('should decode negative zero', () => {
            const result = decode('i-0e');
            assert.strictEqual(result, -0);
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
            const result = decode('li42ei-42ei42.2ei-42.2ei0ei-0ee') as Array<any>;
            assert.deepStrictEqual(result, [ 42, -42, 42, -42, 0, -0 ]);
        });

        test('should decode list with string and integer', () => {
            const result = decode('l4:spami42ee') as Array<any>;
            assert.deepStrictEqual(result, [ Buffer.from('spam'), 42 ]);
        });

        test('should decode list of lists with integers and strings', () => {
            const result = decode('ll4:spam3:bareli42ei-42ei42.2ei-42.2ei0ei-0eee') as Array<any>;

            assert.deepStrictEqual(result, [
                [ Buffer.from('spam'), Buffer.from('bar') ],
                [ 42, -42, 42, -42, 0, -0 ],
            ]);
        });

        test('should decode list of dictionaries with integers and strings', () => {
            const result = decode('ld3:foo4:spam3:bari42eed3:baz4:test3:vazi-42eee') as Array<any>;

            assert.deepStrictEqual(result, [
                { foo: Buffer.from('spam'),  bar: 42 },
                { baz: Buffer.from('test'),  vaz: -42 },
            ]);

        });

    });

    describe('Dictionary tests', () => {

        test('should decode empty dictionary', () => {
            const result = decode('de');
            assert.deepStrictEqual(result, {});
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
            assert.deepStrictEqual(result, { foo: Buffer.from('spam'),  bar: 42 });
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


});
