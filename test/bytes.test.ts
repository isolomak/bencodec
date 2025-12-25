import { Bytes } from '../src/bytes';

describe('Bytes utility class', () => {
	describe('fromString', () => {
		test('should convert string to Uint8Array with utf8 encoding', () => {
			const result = Bytes.fromString('hello');
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(new Uint8Array([
				104, 101, 108, 108, 111,
			]));
		});

		test('should convert string to Uint8Array with utf-8 encoding alias', () => {
			const result = Bytes.fromString('hello', 'utf-8');
			expect(result).toEqual(new Uint8Array([
				104, 101, 108, 108, 111,
			]));
		});

		test('should convert string to Uint8Array with latin1 encoding', () => {
			const result = Bytes.fromString('hello', 'latin1');
			expect(result).toEqual(new Uint8Array([
				104, 101, 108, 108, 111,
			]));
		});

		test('should convert string to Uint8Array with binary encoding', () => {
			const result = Bytes.fromString('hello', 'binary');
			expect(result).toEqual(new Uint8Array([
				104, 101, 108, 108, 111,
			]));
		});

		test('should convert string to Uint8Array with ascii encoding', () => {
			const result = Bytes.fromString('hello', 'ascii');
			expect(result).toEqual(new Uint8Array([
				104, 101, 108, 108, 111,
			]));
		});
	});

	describe('toString', () => {
		test('should convert Uint8Array to string with utf8 encoding', () => {
			const bytes = new Uint8Array([
				104, 101, 108, 108, 111,
			]);
			expect(Bytes.toString(bytes)).toBe('hello');
		});

		test('should convert Uint8Array to string with utf-8 encoding alias', () => {
			const bytes = new Uint8Array([
				104, 101, 108, 108, 111,
			]);
			expect(Bytes.toString(bytes, 'utf-8')).toBe('hello');
		});

		test('should convert Uint8Array to string with latin1 encoding', () => {
			const bytes = new Uint8Array([
				104, 101, 108, 108, 111,
			]);
			expect(Bytes.toString(bytes, 'latin1')).toBe('hello');
		});

		test('should convert Uint8Array to string with binary encoding', () => {
			const bytes = new Uint8Array([
				104, 101, 108, 108, 111,
			]);
			expect(Bytes.toString(bytes, 'binary')).toBe('hello');
		});

		test('should convert Uint8Array to string with ascii encoding', () => {
			const bytes = new Uint8Array([
				104, 101, 108, 108, 111,
			]);
			expect(Bytes.toString(bytes, 'ascii')).toBe('hello');
		});
	});

	describe('concat', () => {
		test('should concatenate multiple Uint8Arrays', () => {
			const a = new Uint8Array([ 1, 2 ]);
			const b = new Uint8Array([ 3, 4 ]);
			const c = new Uint8Array([ 5 ]);
			const result = Bytes.concat([ a, b, c ]);
			expect(result).toEqual(new Uint8Array([
				1, 2, 3, 4, 5,
			]));
		});

		test('should handle empty arrays', () => {
			const result = Bytes.concat([]);
			expect(result).toEqual(new Uint8Array([]));
		});
	});

	describe('compare', () => {
		test('should return 0 for equal arrays', () => {
			const a = new Uint8Array([ 1, 2, 3 ]);
			const b = new Uint8Array([ 1, 2, 3 ]);
			expect(Bytes.compare(a, b)).toBe(0);
		});

		test('should return -1 when first array is less (by byte value)', () => {
			const a = new Uint8Array([ 1, 2, 3 ]);
			const b = new Uint8Array([ 1, 2, 4 ]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		test('should return 1 when first array is greater (by byte value)', () => {
			const a = new Uint8Array([ 1, 2, 4 ]);
			const b = new Uint8Array([ 1, 2, 3 ]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		test('should return -1 when first array is shorter (same prefix)', () => {
			const a = new Uint8Array([ 1, 2 ]);
			const b = new Uint8Array([ 1, 2, 3 ]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		test('should return 1 when first array is longer (same prefix)', () => {
			const a = new Uint8Array([ 1, 2, 3 ]);
			const b = new Uint8Array([ 1, 2 ]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		test('should return 0 for empty arrays', () => {
			const a = new Uint8Array([]);
			const b = new Uint8Array([]);
			expect(Bytes.compare(a, b)).toBe(0);
		});
	});

	describe('byteLength', () => {
		test('should return byte length for ASCII string', () => {
			expect(Bytes.byteLength('hello')).toBe(5);
		});

		test('should return byte length for multi-byte UTF-8 characters', () => {
			// Chinese characters are 3 bytes each in UTF-8
			expect(Bytes.byteLength('\u4e2d\u6587')).toBe(6);
		});

		test('should return 0 for empty string', () => {
			expect(Bytes.byteLength('')).toBe(0);
		});
	});

	describe('isBytes', () => {
		test('should return true for Uint8Array', () => {
			expect(Bytes.isBytes(new Uint8Array([ 1, 2, 3 ]))).toBe(true);
		});

		test('should return false for string', () => {
			expect(Bytes.isBytes('hello')).toBe(false);
		});

		test('should return false for number', () => {
			expect(Bytes.isBytes(123)).toBe(false);
		});

		test('should return false for null', () => {
			expect(Bytes.isBytes(null)).toBe(false);
		});

		test('should return false for undefined', () => {
			expect(Bytes.isBytes(undefined)).toBe(false);
		});

		test('should return false for plain array', () => {
			expect(Bytes.isBytes([ 1, 2, 3 ])).toBe(false);
		});
	});
});
