/**
 * Error codes for bencode operations.
 * Used to programmatically identify error types without parsing error messages.
 *
 * @example
 * ```typescript
 * import { decode, BencodeDecodeError, BencodeErrorCode } from 'bencodec';
 *
 * try {
 *   decode(data);
 * } catch (error) {
 *   if (error instanceof BencodeDecodeError) {
 *     switch (error.code) {
 *       case BencodeErrorCode.EMPTY_INPUT:
 *         console.log('No data provided');
 *         break;
 *       case BencodeErrorCode.INVALID_FORMAT:
 *         console.log('Malformed bencode data');
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export enum BencodeErrorCode {
	// Decoder errors

	/** Input data is empty or falsy */
	EMPTY_INPUT = 'EMPTY_INPUT',

	/** Reached end of data unexpectedly while parsing */
	UNEXPECTED_END = 'UNEXPECTED_END',

	/** Invalid bencode format (unrecognized type marker) */
	INVALID_FORMAT = 'INVALID_FORMAT',

	/** Integer has leading zeros (e.g., i03e) which is invalid in bencode */
	LEADING_ZEROS = 'LEADING_ZEROS',

	/** Negative zero (i-0e) is not allowed in bencode */
	NEGATIVE_ZERO = 'NEGATIVE_ZERO',

	/** Dictionary keys are not in sorted order (strict mode only) */
	UNSORTED_KEYS = 'UNSORTED_KEYS',

	/** Extra data found after valid bencode (strict mode only) */
	TRAILING_DATA = 'TRAILING_DATA',

	// Security limits (reserved for future use)

	/** Maximum nesting depth exceeded */
	MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',

	/** Maximum input size exceeded */
	MAX_SIZE_EXCEEDED = 'MAX_SIZE_EXCEEDED',

	// Encoder errors

	/** Attempted to encode an unsupported JavaScript type */
	UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',

	/** Circular reference detected in data structure */
	CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
}

/**
 * Base error class for all bencode operations.
 * Extends Error with a structured error code for programmatic handling.
 *
 * @example
 * ```typescript
 * try {
 *   decode(data);
 * } catch (error) {
 *   if (error instanceof BencodeError) {
 *     console.log(`Bencode error: ${error.code}`);
 *   }
 * }
 * ```
 */
export abstract class BencodeError extends Error {

	/**
	 * The structured error code identifying the error type.
	 * Use this for programmatic error handling instead of parsing error messages.
	 */
	public readonly code: BencodeErrorCode;

	/**
	 * @param code - The error code identifying the error type
	 * @param message - Human-readable error message
	 */
	protected constructor(code: BencodeErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = this.constructor.name;

		// Maintains proper stack trace for where error was thrown (V8 engines)
		Error.captureStackTrace?.(this, this.constructor);
	}

}

/**
 * Error thrown during bencode decoding operations.
 * Includes the buffer position where the error occurred for debugging.
 *
 * @example
 * ```typescript
 * try {
 *   decode('i03e'); // Leading zeros not allowed
 * } catch (error) {
 *   if (error instanceof BencodeDecodeError) {
 *     console.log(`Error code: ${error.code}`);
 *     console.log(`Position: ${error.position}`);
 *     console.log(`Message: ${error.message}`);
 *     // Output:
 *     // Error code: LEADING_ZEROS
 *     // Position: 1
 *     // Message: Invalid bencode: leading zeros are not allowed at position 1 (found '0')
 *   }
 * }
 * ```
 */
export class BencodeDecodeError extends BencodeError {

	/**
	 * The byte position in the input buffer where the error occurred.
	 * Undefined for errors that occur before parsing begins (e.g., empty input)
	 * or after successful parsing (e.g., trailing data in strict mode).
	 */
	public readonly position?: number;

	/**
	 * @param code - The error code identifying the error type
	 * @param message - Human-readable error message
	 * @param position - The byte position where the error occurred (optional)
	 */
	public constructor(code: BencodeErrorCode, message: string, position?: number) {
		super(code, message);
		this.position = position;
	}

}

/**
 * Error thrown during bencode encoding operations.
 * Includes the path to the problematic value for debugging nested structures.
 *
 * @example
 * ```typescript
 * const data = { outer: { inner: circularRef } };
 * try {
 *   encode(data);
 * } catch (error) {
 *   if (error instanceof BencodeEncodeError) {
 *     console.log(`Error code: ${error.code}`);
 *     console.log(`Path: ${error.path?.join('.')}`);
 *     // Output:
 *     // Error code: CIRCULAR_REFERENCE
 *     // Path: outer.inner
 *   }
 * }
 * ```
 */
export class BencodeEncodeError extends BencodeError {

	/**
	 * The path to the value that caused the error.
	 * Array indices are numbers, object keys are strings.
	 * Undefined for top-level errors (e.g., encoding a function directly).
	 */
	public readonly path?: (string | number)[];

	/**
	 * @param code - The error code identifying the error type
	 * @param message - Human-readable error message
	 * @param path - The path to the problematic value (optional)
	 */
	public constructor(code: BencodeErrorCode, message: string, path?: (string | number)[]) {
		super(code, message);
		this.path = path;
	}

}
