import {
	BencodeError,
	BencodeDecodeError,
	BencodeEncodeError,
	BencodeErrorCode,
} from '../src/errors';

describe('BencodeError classes', () => {
	describe('BencodeDecodeError', () => {
		test('should be instance of Error and BencodeError', () => {
			const error = new BencodeDecodeError(
				BencodeErrorCode.EMPTY_INPUT,
				'test message',
			);
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(BencodeError);
			expect(error).toBeInstanceOf(BencodeDecodeError);
		});

		test('should have correct name', () => {
			const error = new BencodeDecodeError(
				BencodeErrorCode.EMPTY_INPUT,
				'test message',
			);
			expect(error.name).toBe('BencodeDecodeError');
		});

		test('should have code and message', () => {
			const error = new BencodeDecodeError(
				BencodeErrorCode.INVALID_FORMAT,
				'Invalid data',
			);
			expect(error.code).toBe(BencodeErrorCode.INVALID_FORMAT);
			expect(error.message).toBe('Invalid data');
		});

		test('should have position when provided', () => {
			const error = new BencodeDecodeError(
				BencodeErrorCode.UNEXPECTED_END,
				'Unexpected end',
				42,
			);
			expect(error.position).toBe(42);
		});

		test('should have undefined position when not provided', () => {
			const error = new BencodeDecodeError(
				BencodeErrorCode.EMPTY_INPUT,
				'Nothing to decode',
			);
			expect(error.position).toBeUndefined();
		});
	});

	describe('BencodeEncodeError', () => {
		test('should be instance of Error and BencodeError', () => {
			const error = new BencodeEncodeError(
				BencodeErrorCode.UNSUPPORTED_TYPE,
				'test message',
			);
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(BencodeError);
			expect(error).toBeInstanceOf(BencodeEncodeError);
		});

		test('should have correct name', () => {
			const error = new BencodeEncodeError(
				BencodeErrorCode.CIRCULAR_REFERENCE,
				'test message',
			);
			expect(error.name).toBe('BencodeEncodeError');
		});

		test('should have code and message', () => {
			const error = new BencodeEncodeError(
				BencodeErrorCode.UNSUPPORTED_TYPE,
				'function is unsupported type.',
			);
			expect(error.code).toBe(BencodeErrorCode.UNSUPPORTED_TYPE);
			expect(error.message).toBe('function is unsupported type.');
		});

		test('should have path when provided', () => {
			const error = new BencodeEncodeError(
				BencodeErrorCode.CIRCULAR_REFERENCE,
				'Circular reference',
				[ 'outer', 'inner', 0 ],
			);
			expect(error.path).toEqual([ 'outer', 'inner', 0 ]);
		});

		test('should have undefined path when not provided', () => {
			const error = new BencodeEncodeError(
				BencodeErrorCode.UNSUPPORTED_TYPE,
				'function is unsupported type.',
			);
			// Note: The error class itself can still have undefined path,
			// but the encoder now always passes an array (empty for top-level)
			expect(error.path).toBeUndefined();
		});
	});

	describe('BencodeErrorCode enum', () => {
		test('should have all expected error codes', () => {
			expect(BencodeErrorCode.EMPTY_INPUT).toBe('EMPTY_INPUT');
			expect(BencodeErrorCode.UNEXPECTED_END).toBe('UNEXPECTED_END');
			expect(BencodeErrorCode.INVALID_FORMAT).toBe('INVALID_FORMAT');
			expect(BencodeErrorCode.LEADING_ZEROS).toBe('LEADING_ZEROS');
			expect(BencodeErrorCode.NEGATIVE_ZERO).toBe('NEGATIVE_ZERO');
			expect(BencodeErrorCode.UNSORTED_KEYS).toBe('UNSORTED_KEYS');
			expect(BencodeErrorCode.TRAILING_DATA).toBe('TRAILING_DATA');
			expect(BencodeErrorCode.MAX_DEPTH_EXCEEDED).toBe('MAX_DEPTH_EXCEEDED');
			expect(BencodeErrorCode.MAX_SIZE_EXCEEDED).toBe('MAX_SIZE_EXCEEDED');
			expect(BencodeErrorCode.UNSUPPORTED_TYPE).toBe('UNSUPPORTED_TYPE');
			expect(BencodeErrorCode.CIRCULAR_REFERENCE).toBe('CIRCULAR_REFERENCE');
		});
	});
});
