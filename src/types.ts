import { Buffer } from 'node:buffer';

/**
 * Configuration options for bencode encoding and decoding operations.
 *
 * @example
 * ```typescript
 * // Decode with string output and strict validation
 * const data = decode(buffer, { stringify: true, strict: true });
 *
 * // Decode with security limits
 * const data = decode(buffer, { maxStringLength: 1024 * 1024, maxDepth: 100 });
 * ```
 */
export interface IBencodecOptions {
	/**
	 * When `true`, returns strings instead of Buffers.
	 *
	 * - **Decoding**: String values are returned as JavaScript strings instead of Buffers.
	 *   Uses the `encoding` option (default: 'utf8') for conversion.
	 * - **Encoding**: Returns the encoded bencode data as a UTF-8 string instead of a Buffer.
	 *
	 * @default false
	 */
	stringify?: boolean;

	/**
	 * Enables strict bencode validation according to the BitTorrent specification.
	 *
	 * When `true`, the following additional validations are performed during decoding:
	 * - Dictionary keys must be in sorted (lexicographic) order
	 * - No trailing data is allowed after the decoded value
	 *
	 * @default false
	 * @throws {BencodeDecodeError} With code `UNSORTED_KEYS` if dictionary keys are not sorted
	 * @throws {BencodeDecodeError} With code `TRAILING_DATA` if extra data follows the bencode value
	 */
	strict?: boolean;

	/**
	 * Character encoding to use when `stringify` is `true`.
	 * Only applies to decoding operations.
	 *
	 * @default 'utf8'
	 */
	encoding?: BufferEncoding;

	/**
	 * Maximum allowed length for decoded strings in bytes.
	 * Provides protection against memory exhaustion from malicious input.
	 *
	 * @throws {BencodeDecodeError} With code `MAX_SIZE_EXCEEDED` if a string exceeds this limit
	 */
	maxStringLength?: number;

	/**
	 * Maximum allowed nesting depth for lists and dictionaries.
	 * Provides protection against stack overflow from deeply nested structures.
	 *
	 * @throws {BencodeDecodeError} With code `MAX_DEPTH_EXCEEDED` if nesting exceeds this limit
	 */
	maxDepth?: number;
}

/**
 * Byte markers used in bencode format.
 * These are the ASCII byte values that delimit bencode data types.
 *
 * @internal
 */
export enum FLAG {
	/** Integer start marker: 'i' (0x69) - marks the beginning of an integer value */
	INTEGER = 0x69,
	/** String length delimiter: ':' (0x3a) - separates string length from content */
	STR_DELIMITER = 0x3a,
	/** List start marker: 'l' (0x6c) - marks the beginning of a list */
	LIST = 0x6c,
	/** Dictionary start marker: 'd' (0x64) - marks the beginning of a dictionary */
	DICTIONARY = 0x64,
	/** End marker: 'e' (0x65) - marks the end of integers, lists, and dictionaries */
	END = 0x65,
	/** Minus sign: '-' (0x2d) - used for negative integers */
	MINUS = 0x2d,
	/** Plus sign: '+' (0x2b) - non-standard extension, silently ignored during decoding */
	PLUS = 0x2b,
	/** Decimal point: '.' (0x2e) - non-standard extension for floats, fractional part is truncated */
	DOT = 0x2e,
}

/**
 * A decoded bencode list (array of decoded values).
 *
 * @see {@link BencodeDecodedValue} for possible element types
 */
export type BencodeDecodedList = Array<BencodeDecodedValue>;

/**
 * A decoded bencode dictionary (object with string keys and decoded values).
 *
 * Keys are always strings (decoded from bencode byte strings).
 *
 * @see {@link BencodeDecodedValue} for possible value types
 */
export type BencodeDecodedDictionary = { [key: string]: BencodeDecodedValue };

/**
 * Union type representing all possible values returned by the decoder.
 *
 * - `number` - Decoded bencode integers
 * - `Buffer` - Decoded bencode strings (when `stringify: false`, the default)
 * - `string` - Decoded bencode strings (when `stringify: true`)
 * - `BencodeDecodedList` - Decoded bencode lists
 * - `BencodeDecodedDictionary` - Decoded bencode dictionaries
 */
export type BencodeDecodedValue = number | Buffer | string | BencodeDecodedList | BencodeDecodedDictionary;

/**
 * An encodable list (array of encodable values).
 *
 * @see {@link BencodeEncodableValue} for possible element types
 */
export type BencodeEncodableList = Array<BencodeEncodableValue>;

/**
 * An encodable dictionary (object with string keys and encodable values).
 *
 * Keys will be automatically sorted lexicographically during encoding
 * to comply with the bencode specification.
 *
 * @see {@link BencodeEncodableValue} for possible value types
 */
export type BencodeEncodableDictionary = { [key: string]: BencodeEncodableValue };

/**
 * Union type representing all JavaScript values that can be encoded to bencode.
 *
 * **Supported types and their encoding:**
 * - `number` - Encoded as bencode integer. Floats are truncated toward zero.
 * - `boolean` - Encoded as bencode integer (`true` → `i1e`, `false` → `i0e`)
 * - `string` - Encoded as bencode string (UTF-8 byte length prefix)
 * - `Buffer` - Encoded as bencode string (raw bytes)
 * - `ArrayBuffer` - Encoded as bencode string (raw bytes)
 * - `ArrayBufferView` - Encoded as bencode string (e.g., Uint8Array, DataView)
 * - `BencodeEncodableList` - Encoded as bencode list
 * - `BencodeEncodableDictionary` - Encoded as bencode dictionary
 * - `null` / `undefined` - Silently skipped in lists and dictionaries
 *
 * @example
 * ```typescript
 * // All of these are valid encodable values
 * encode(42);              // 'i42e'
 * encode(true);            // 'i1e'
 * encode('hello');         // '5:hello'
 * encode([1, 2, 3]);       // 'li1ei2ei3ee'
 * encode({ a: 1, b: 2 });  // 'd1:ai1e1:bi2ee'
 * ```
 */
export type BencodeEncodableValue = number
	| boolean
	| string
	| Buffer
	| ArrayBuffer
	| ArrayBufferView
	| BencodeEncodableList
	| BencodeEncodableDictionary
	| null
	| undefined;
