import * as assert from 'assert';
import { encode, encodeToBytes, encodeToString, BencodeEncodeError, BencodeErrorCode } from '../src/index';
import { Bytes, ByteEncoding } from '../src/bytes';

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
			encode(obj);
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
			expect(() => encode(obj)).toThrow('Circular reference detected');

			try {
				encode(obj);
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
			expect(() => encode(arr)).toThrow('Circular reference detected');

			try {
				encode(arr);
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
			expect(() => encode(obj)).toThrow('Circular reference detected');

			try {
				encode(obj);
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
			expect(() => encode(obj)).toThrow('Circular reference detected');

			try {
				encode(obj);
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

	describe('Type compatibility', () => {
		test('should accept interfaces without index signatures', () => {
			// This tests the generic overload that allows typed interfaces
			interface IRawRpcMessage {
				t: Uint8Array;
				y: string;
				q?: string;
				a?: { id: string };
			}

			const message: IRawRpcMessage = {
				t: Bytes.fromString('abc'),
				y: 'q',
				q: 'ping',
			};

			// This should compile without errors (no type assertion needed)
			const result = encode(message, { stringify: true });
			expect(result).toBe('d1:q4:ping1:t3:abc1:y1:qe');
		});

		test('should accept nested interfaces', () => {
			interface Inner {
				value: number;
			}
			interface Outer {
				name: string;
				nested: Inner;
			}

			const obj: Outer = {
				name: 'test',
				nested: { value: 42 },
			};

			const result = encode(obj, { stringify: true });
			expect(result).toBe('d4:name4:test6:nestedd5:valuei42eee');
		});

		test('should accept interfaces with optional properties', () => {
			interface Config {
				required: string;
				optional?: number;
			}

			const config: Config = { required: 'value' };
			const result = encode(config, { stringify: true });
			expect(result).toBe('d8:required5:valuee');
		});
	});
});

describe('encodeToBytes', () => {
	test('should return Uint8Array', () => {
		const result = encodeToBytes({ foo: 42 });
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('d3:fooi42ee'));
	});

	test('should encode integer', () => {
		const result = encodeToBytes(42);
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('i42e'));
	});

	test('should encode string', () => {
		const result = encodeToBytes('hello');
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('5:hello'));
	});

	test('should encode list', () => {
		const result = encodeToBytes([ 1, 2, 3 ]);
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('li1ei2ei3ee'));
	});

	test('should encode dictionary', () => {
		const result = encodeToBytes({ foo: 'bar' });
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('d3:foo3:bare'));
	});

	test('should accept typed interfaces', () => {
		interface Data { name: string; value: number }
		const data: Data = { name: 'test', value: 42 };
		const result = encodeToBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
		assert.deepStrictEqual(result, Bytes.fromString('d4:name4:test5:valuei42ee'));
	});

	test('should throw BencodeEncodeError for circular references', () => {
		const obj: Record<string, unknown> = { foo: 'bar' };
		obj.self = obj;
		expect(() => encodeToBytes(obj)).toThrow(BencodeEncodeError);

		try {
			encodeToBytes(obj);
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
		}
	});

	test('should throw BencodeEncodeError for unsupported types', () => {
		// @ts-ignore - for testing purposes
		expect(() => encodeToBytes(() => { })).toThrow(BencodeEncodeError);

		try {
			// @ts-ignore - for testing purposes
			encodeToBytes(() => { });
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.UNSUPPORTED_TYPE);
		}
	});
});

describe('encodeToString', () => {
	test('should return string with default utf8 encoding', () => {
		const result = encodeToString({ foo: 42 });
		expect(typeof result).toBe('string');
		expect(result).toBe('d3:fooi42ee');
	});

	test('should encode integer', () => {
		const result = encodeToString(42);
		expect(result).toBe('i42e');
	});

	test('should encode string', () => {
		const result = encodeToString('hello');
		expect(result).toBe('5:hello');
	});

	test('should encode list', () => {
		const result = encodeToString([ 1, 2, 3 ]);
		expect(result).toBe('li1ei2ei3ee');
	});

	test('should encode dictionary', () => {
		const result = encodeToString({ foo: 'bar' });
		expect(result).toBe('d3:foo3:bare');
	});

	test('should support utf8 encoding explicitly', () => {
		const result = encodeToString({ foo: 'bar' }, { encoding: 'utf8' });
		expect(result).toBe('d3:foo3:bare');
	});

	test('should support utf-8 encoding alias', () => {
		const result = encodeToString({ foo: 'bar' }, { encoding: 'utf-8' });
		expect(result).toBe('d3:foo3:bare');
	});

	test('should support latin1 encoding', () => {
		const result = encodeToString('test', { encoding: 'latin1' });
		expect(result).toBe('4:test');
	});

	test('should support binary encoding', () => {
		const result = encodeToString('test', { encoding: 'binary' });
		expect(result).toBe('4:test');
	});

	test('should support ascii encoding', () => {
		const result = encodeToString('test', { encoding: 'ascii' });
		expect(result).toBe('4:test');
	});

	test('should support all ByteEncoding types', () => {
		const encodings: ByteEncoding[] = [
			'utf8', 'utf-8', 'latin1', 'binary', 'ascii',
		];
		for (const encoding of encodings) {
			const result = encodeToString('test', { encoding });
			expect(typeof result).toBe('string');
			expect(result).toBe('4:test');
		}
	});

	test('should handle binary data with latin1 encoding', () => {
		const bytes = new Uint8Array([ 0x00, 0x01, 0xff ]);
		const result = encodeToString(bytes, { encoding: 'latin1' });
		expect(result).toBe('3:\x00\x01\xff');
	});

	test('should accept typed interfaces', () => {
		interface Data { name: string; value: number }
		const data: Data = { name: 'test', value: 42 };
		const result = encodeToString(data);
		expect(result).toBe('d4:name4:test5:valuei42ee');
	});

	test('should throw BencodeEncodeError for circular references', () => {
		const obj: Record<string, unknown> = { foo: 'bar' };
		obj.self = obj;
		expect(() => encodeToString(obj)).toThrow(BencodeEncodeError);

		try {
			encodeToString(obj);
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.CIRCULAR_REFERENCE);
		}
	});

	test('should throw BencodeEncodeError for unsupported types', () => {
		// @ts-ignore - for testing purposes
		expect(() => encodeToString(() => { })).toThrow(BencodeEncodeError);

		try {
			// @ts-ignore - for testing purposes
			encodeToString(() => { });
		}
		catch (error) {
			expect(error).toBeInstanceOf(BencodeEncodeError);
			expect((error as BencodeEncodeError).code).toBe(BencodeErrorCode.UNSUPPORTED_TYPE);
		}
	});
});
