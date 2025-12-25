import * as assert from 'assert';
import { encode, BencodeEncodeError, BencodeErrorCode, BencodeEncodableValue } from '../src/index';
import { Bytes } from '../src/bytes';

describe('Bencode encoder test', () => {
	test('should throw BencodeEncodeError with UNSUPPORTED_TYPE code for unsupported type', () => {
		// @ts-ignore - for testing purposes
		expect(() => encode(() => { })).toThrow(BencodeEncodeError);

		try {
			// @ts-ignore - for testing purposes
			encode(() => { });
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.UNSUPPORTED_TYPE);
			// path is empty array for top-level errors
			expect((error as BencodeEncodeError).path).toEqual([]);
		}
	});

	test('should include path for unsupported type in nested structure', () => {
		const obj = {
			valid: 'data',
			nested: {
				invalid: (): void => { /* empty */ },
			},
		};

		try {
			encode(obj as unknown as BencodeEncodableValue);
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.UNSUPPORTED_TYPE);
			expect((error as BencodeEncodeError).path).toEqual([ 'nested', 'invalid' ]);
		}
	});

	describe('Uint8Array tests', () => {
		test('should encode empty Uint8Array', () => {
			const result = encode(Bytes.fromString(''));
			assert.deepStrictEqual(result, Bytes.fromString('0:'));
		});

		test('should encode Uint8Array', () => {
			const result = encode(Bytes.fromString('spam'));
			assert.deepStrictEqual(result, Bytes.fromString('4:spam'));
		});
	});

	describe('String tests', () => {
		test('should encode empty string', () => {
			const result = encode('');
			assert.deepStrictEqual(result, Bytes.fromString('0:'));
		});

		test('should encode string', () => {
			const result = encode('spam');
			assert.deepStrictEqual(result, Bytes.fromString('4:spam'));
		});
	});

	describe('Boolean tests', () => {
		test('should encode true as 1', () => {
			const result = encode(true);
			assert.deepStrictEqual(result, Bytes.fromString('i1e'));
		});

		test('should encode false as 0', () => {
			const result = encode(false);
			assert.deepStrictEqual(result, Bytes.fromString('i0e'));
		});
	});

	describe('ArrayBuffer tests', () => {
		const toArrayBuffer = (bytes: Uint8Array) => {
			const arrayBuffer = new ArrayBuffer(bytes.length);
			const view = new Uint8Array(arrayBuffer);
			for (let i = 0; i < bytes.length; ++i) {
				view[i] = bytes[i];
			}

			return arrayBuffer;
		};

		test('should encode ArrayBuffer', () => {
			const result = encode(toArrayBuffer(Bytes.fromString('spam')));
			assert.deepStrictEqual(result, Bytes.fromString('4:spam'));
		});

		test('should encode DataView', () => {
			const result = encode(new DataView(toArrayBuffer(Bytes.fromString('spam'))));
			assert.deepStrictEqual(result, Bytes.fromString('4:spam'));
		});
	});

	describe('Integer tests', () => {
		test('should encode integer', () => {
			const result = encode(42);
			assert.deepStrictEqual(result, Bytes.fromString('i42e'));
		});

		test('should encode negative integer', () => {
			const result = encode(-42);
			assert.deepStrictEqual(result, Bytes.fromString('i-42e'));
		});

		test('should encode zero', () => {
			const result = encode(0);
			assert.deepStrictEqual(result, Bytes.fromString('i0e'));
		});

		test('should encode negative zero', () => {
			const result = encode(-0);
			assert.deepStrictEqual(result, Bytes.fromString('i0e'));
		});

		test('should encode float as int', () => {
			const result = encode(42.2);
			assert.deepStrictEqual(result, Bytes.fromString('i42e'));
		});

		test('should encode negative float as int', () => {
			const result = encode(-42.2);
			assert.deepStrictEqual(result, Bytes.fromString('i-42e'));
		});

		test('should truncate float toward zero (not round)', () => {
			// 42.5 truncates to 42 (not 43)
			assert.deepStrictEqual(encode(42.5), Bytes.fromString('i42e'));
			// 42.9 truncates to 42 (not 43)
			assert.deepStrictEqual(encode(42.9), Bytes.fromString('i42e'));
			// -42.5 truncates to -42 (not -43)
			assert.deepStrictEqual(encode(-42.5), Bytes.fromString('i-42e'));
			// -42.9 truncates to -42 (not -43)
			assert.deepStrictEqual(encode(-42.9), Bytes.fromString('i-42e'));
		});
	});

	describe('List tests', () => {
		test('should encode empty list', () => {
			const result = encode([]);
			assert.deepStrictEqual(result, Bytes.fromString('le'));
		});

		test('should encode list of strings', () => {
			const result = encode([ 'spam', 'bar' ]);
			assert.deepStrictEqual(result, Bytes.fromString('l4:spam3:bare'));
		});

		test('should encode list of integers', () => {
			const result = encode([
				42, -42, 42.2, -42.2, 0, -0,
			]);
			assert.deepStrictEqual(result, Bytes.fromString('li42ei-42ei42ei-42ei0ei0ee'));
		});

		test('should encode list with string and integer', () => {
			const result = encode([ 'spam', 42 ]);
			assert.deepStrictEqual(result, Bytes.fromString('l4:spami42ee'));
		});

		test('should encode list of lists with integers and strings', () => {
			const result = encode([
				[ 'spam', 'bar' ], [
					42, -42, 42.2, -42.2, 0, -0,
				],
			]);
			assert.deepStrictEqual(result, Bytes.fromString('ll4:spam3:bareli42ei-42ei42ei-42ei0ei0eee'));
		});

		test('should encode list of dictionaries with integers and strings', () => {
			const result = encode([{ foo: 'spam', bar: 42 }, { baz: 'cow', vaz: -42 }]);
			assert.deepStrictEqual(result, Bytes.fromString('ld3:bari42e3:foo4:spamed3:baz3:cow3:vazi-42eee'));
		});

		test('should encode list and skip null and undefined values', () => {
			// @ts-ignore - for testing purposes
			const result = encode([ null, undefined, 42 ]);
			assert.deepStrictEqual(result, Bytes.fromString('li42ee'));
		});
	});

	describe('Dictionary tests', () => {
		test('should encode empty dictionary', () => {
			const result = encode({ });
			assert.deepStrictEqual(result, Bytes.fromString('de'));
		});

		test('should encode dictionary with string', () => {
			const result = encode({ bar: 'spam' });
			assert.deepStrictEqual(result, Bytes.fromString('d3:bar4:spame'));
		});

		test('should encode dictionary with integer', () => {
			const result = encode({ bar: 42 });
			assert.deepStrictEqual(result, Bytes.fromString('d3:bari42ee'));
		});

		test('should encode dictionary with string and integer', () => {
			const result = encode({ foo: 'spam', bar: 42 });
			assert.deepStrictEqual(result, Bytes.fromString('d3:bari42e3:foo4:spame'));
		});

		test('should encode dictionary with list', () => {
			const result = encode({ bar: [ 'spam', 42 ] });
			assert.deepStrictEqual(result, Bytes.fromString('d3:barl4:spami42eee'));
		});

		test('should encode dictionary with dictionary', () => {
			const result = encode({ bar: { cow: 'spam' } });
			assert.deepStrictEqual(result, Bytes.fromString('d3:bard3:cow4:spamee'));
		});

		test('should encode dictionary and skip null and undefined values', () => {
			// @ts-ignore - for testing purposes
			const result = encode({ bar: null, cow: null, baz: 42 });
			assert.deepStrictEqual(result, Bytes.fromString('d3:bazi42ee'));
		});
	});

	test('should stringify encoded data', () => {
		const result = encode({ bar: [ 'cow', 42 ] }, { stringify: true });
		assert.deepStrictEqual(result, 'd3:barl3:cowi42eee');
	});

	describe('Circular reference tests', () => {
		test('should throw BencodeEncodeError with CIRCULAR_REFERENCE code for circular reference in dictionary', () => {
			const obj: Record<string, unknown> = { foo: 'bar' };
			obj.self = obj;
			expect(() => encode(obj as unknown as BencodeEncodableValue)).toThrow('Circular reference detected');

			try {
				encode(obj as unknown as BencodeEncodableValue);
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeEncodeError);
				expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
				expect((error as BencodeEncodeError).path).toEqual([ 'self' ]);
			}
		});

		test('should throw BencodeEncodeError with CIRCULAR_REFERENCE code for circular reference in list', () => {
			const arr: unknown[] = [ 1, 2 ];
			arr.push(arr);
			expect(() => encode(arr as unknown as BencodeEncodableValue)).toThrow('Circular reference detected');

			try {
				encode(arr as unknown as BencodeEncodableValue);
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeEncodeError);
				expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
				expect((error as BencodeEncodeError).path).toEqual([ 2 ]);
			}
		});

		test('should throw BencodeEncodeError with path for nested circular reference', () => {
			const obj: Record<string, unknown> = { foo: 'bar' };
			obj.nested = { inner: obj };
			expect(() => encode(obj as unknown as BencodeEncodableValue)).toThrow('Circular reference detected');

			try {
				encode(obj as unknown as BencodeEncodableValue);
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeEncodeError);
				expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
				expect((error as BencodeEncodeError).path).toEqual([ 'nested', 'inner' ]);
			}
		});

		test('should throw BencodeEncodeError with path for circular reference between list and dictionary', () => {
			const obj: Record<string, unknown> = { foo: 'bar' };
			const arr: unknown[] = [ obj ];
			obj.list = arr;
			expect(() => encode(obj as unknown as BencodeEncodableValue)).toThrow('Circular reference detected');

			try {
				encode(obj as unknown as BencodeEncodableValue);
			}
			catch (error) {
				expect(error).toBeInstanceOf(BencodeEncodeError);
				expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
				// The circular reference is detected at 'list' -> [0] -> back to obj
				expect((error as BencodeEncodeError).path).toEqual([ 'list', 0 ]);
			}
		});

		test('should allow same object in different branches', () => {
			const shared = { value: 42 };
			const obj = { a: shared, b: shared };
			const result = encode(obj);
			assert.deepStrictEqual(result, Bytes.fromString('d1:ad5:valuei42ee1:bd5:valuei42eee'));
		});
	});
});
