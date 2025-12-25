import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';
import { BencodeEncodableValue, IBencodecOptions, IBencodeEncodeOptions } from './types';
import { BencodeDecodeError, BencodeErrorCode } from './errors';
import { Bytes } from './bytes';

export type { IBencodecOptions, IBencodeEncodeOptions, BencodeDecodedValue, BencodeEncodableValue } from './types';
export type { ByteEncoding } from './bytes';
export * from './errors';

/**
 * Decodes bencode data into JavaScript values.
 *
 * Parses bencode-encoded data according to the
 * {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * @typeParam Type - The expected return type. Defaults to `unknown`. Use with caution as
 *   no runtime validation is performed.
 *
 * @param data - The bencode data to decode. Can be a Uint8Array or a string (which will be
 *   converted to a Uint8Array internally).
 * @param options - Configuration options for decoding behavior.
 *
 * @returns The decoded JavaScript value. The return type depends on the bencode data:
 *   - Bencode integers → `number`
 *   - Bencode strings → `Uint8Array` (default) or `string` (if `stringify: true`)
 *   - Bencode lists → `Array`
 *   - Bencode dictionaries → `Object`
 *
 * @throws {BencodeDecodeError} With code `EMPTY_INPUT` if data is empty or falsy.
 * @throws {BencodeDecodeError} With code `INVALID_FORMAT` if data is not valid bencode.
 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if data ends unexpectedly.
 * @throws {BencodeDecodeError} With code `LEADING_ZEROS` if an integer has leading zeros (e.g., `i03e`).
 * @throws {BencodeDecodeError} With code `NEGATIVE_ZERO` if negative zero is encountered (`i-0e`).
 * @throws {BencodeDecodeError} With code `UNSORTED_KEYS` if `strict: true` and dictionary keys
 *   are not in lexicographic order.
 * @throws {BencodeDecodeError} With code `TRAILING_DATA` if `strict: true` and extra data
 *   follows the decoded value.
 * @throws {BencodeDecodeError} With code `MAX_SIZE_EXCEEDED` if a string exceeds `maxStringLength`.
 * @throws {BencodeDecodeError} With code `MAX_DEPTH_EXCEEDED` if nesting exceeds `maxDepth`.
 *
 * @example
 * ```typescript
 * import { decode } from 'bencodec';
 *
 * // Decode an integer
 * decode('i42e');  // 42
 *
 * // Decode a string (returns Uint8Array by default)
 * decode('5:hello');  // Uint8Array [0x68, 0x65, 0x6c, 0x6c, 0x6f]
 *
 * // Decode a string as JavaScript string
 * decode('5:hello', { stringify: true });  // 'hello'
 *
 * // Decode a list
 * decode('li1ei2ei3ee', { stringify: true });  // [1, 2, 3]
 *
 * // Decode a dictionary
 * decode('d3:fooi42ee', { stringify: true });  // { foo: 42 }
 *
 * // Use strict mode for validation
 * decode('i42eextra', { strict: true });  // throws TRAILING_DATA error
 *
 * // Type the result
 * interface Torrent { announce: string; info: { name: string } }
 * const torrent = decode<Torrent>(buffer, { stringify: true });
 * ```
 *
 * @remarks
 * **Non-standard behaviors:**
 * - **Plus sign in integers**: A leading `+` sign (e.g., `i+42e`) is silently ignored.
 * - **Float truncation**: Decimal numbers (e.g., `i3.14e`) are truncated toward zero,
 *   keeping only the integer part (`3`). The fractional part is discarded.
 *
 * **Strict mode:**
 * When `options.strict` is `true`, additional validations are performed:
 * - Dictionary keys must be in sorted lexicographic order
 * - No trailing data is allowed after the decoded value
 *
 * These checks are disabled by default for performance and to handle
 * non-compliant data from some BitTorrent clients.
 */
export function decode<Type = unknown>(data: Uint8Array | string, options?: IBencodecOptions): Type {
	const decoder = new BencodeDecoder(data, options);
	const result = decoder.decode();

	if (options?.strict && decoder.hasRemainingData()) {
		throw new BencodeDecodeError(BencodeErrorCode.TRAILING_DATA, 'Invalid bencode: unexpected data after valid bencode');
	}

	return result as Type;
}

/**
 * Encodes JavaScript values into bencode format.
 *
 * Produces bencode-encoded data according to the
 * {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * @deprecated Use {@link encodeToBytes} for Uint8Array output or {@link encodeToString} for string output.
 * This function will be removed in a future major version.
 *
 * @param data - The value to encode. See {@link BencodeEncodableValue} for supported types.
 * @param options - Configuration options for encoding behavior.
 *
 * @returns The bencode-encoded data as a Uint8Array (default) or string (if `stringify: true`).
 *
 * @throws {BencodeEncodeError} With code `UNSUPPORTED_TYPE` if the value contains an
 *   unsupported type (e.g., functions, symbols, BigInt).
 * @throws {BencodeEncodeError} With code `CIRCULAR_REFERENCE` if the data contains
 *   circular references.
 *
 * @example
 * ```typescript
 * import { encode } from 'bencodec';
 *
 * // Encode an integer
 * encode(42);  // Uint8Array [0x69, 0x34, 0x32, 0x65] ('i42e')
 *
 * // Encode a string
 * encode('hello');  // Uint8Array [0x35, 0x3a, 0x68, 0x65, 0x6c, 0x6c, 0x6f] ('5:hello')
 *
 * // Encode a list
 * encode([1, 2, 3]);  // 'li1ei2ei3ee'
 *
 * // Encode a dictionary (keys are auto-sorted)
 * encode({ z: 1, a: 2 });  // 'd1:ai2e1:zi1ee' (keys sorted: a, z)
 *
 * // Get result as string instead of Uint8Array
 * encode({ foo: 'bar' }, { stringify: true });  // 'd3:foo3:bare'
 *
 * // Encode binary data
 * encode(new Uint8Array([0x00, 0xff]));  // '2:\x00\xff'
 * encode(new Uint8Array([1, 2, 3]));     // '3:\x01\x02\x03'
 * ```
 *
 * @remarks
 * **Non-standard behaviors:**
 * - **Boolean encoding**: Booleans are encoded as integers (`true` → `i1e`, `false` → `i0e`).
 *   Standard bencode does not define boolean types.
 * - **Float truncation**: Floating-point numbers are truncated toward zero before encoding.
 *   For example, `3.7` becomes `i3e` and `-2.9` becomes `i-2e`.
 * - **Null/undefined handling**: `null` and `undefined` values are silently skipped
 *   in lists and dictionaries. They cannot be encoded as top-level values.
 *
 * **Dictionary key sorting:**
 * Dictionary keys are automatically sorted lexicographically (by raw byte value)
 * to comply with the bencode specification. The original key order is not preserved.
 */
export function encode<T extends object>(data: T, options?: IBencodecOptions): Uint8Array | string;
export function encode(data: BencodeEncodableValue, options?: IBencodecOptions): Uint8Array | string;
export function encode(data: BencodeEncodableValue, options?: IBencodecOptions): Uint8Array | string {
	const encoder = new BencodeEncoder(options);

	return encoder.encode(data);
}

/**
 * Encodes JavaScript values into bencode format as a Uint8Array.
 *
 * Produces bencode-encoded data according to the
 * {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * @param data - The value to encode. See {@link BencodeEncodableValue} for supported types.
 *
 * @returns The bencode-encoded data as a Uint8Array.
 *
 * @throws {BencodeEncodeError} With code `UNSUPPORTED_TYPE` if the value contains an
 *   unsupported type (e.g., functions, symbols, BigInt).
 * @throws {BencodeEncodeError} With code `CIRCULAR_REFERENCE` if the data contains
 *   circular references.
 *
 * @example
 * ```typescript
 * import { encodeToBytes } from 'bencodec';
 *
 * // Encode an integer
 * encodeToBytes(42);  // Uint8Array [0x69, 0x34, 0x32, 0x65] ('i42e')
 *
 * // Encode a string
 * encodeToBytes('hello');  // Uint8Array [0x35, 0x3a, 0x68, 0x65, 0x6c, 0x6c, 0x6f] ('5:hello')
 *
 * // Encode a dictionary
 * encodeToBytes({ foo: 'bar' });  // Uint8Array for 'd3:foo3:bare'
 *
 * // Encode binary data
 * encodeToBytes(new Uint8Array([0x00, 0xff]));  // Uint8Array for '2:\x00\xff'
 * ```
 *
 * @remarks
 * **Non-standard behaviors:**
 * - **Boolean encoding**: Booleans are encoded as integers (`true` → `i1e`, `false` → `i0e`).
 * - **Float truncation**: Floating-point numbers are truncated toward zero before encoding.
 * - **Null/undefined handling**: `null` and `undefined` values are silently skipped
 *   in lists and dictionaries. They cannot be encoded as top-level values.
 *
 * **Dictionary key sorting:**
 * Dictionary keys are automatically sorted lexicographically (by raw byte value)
 * to comply with the bencode specification.
 */
export function encodeToBytes<T extends object>(data: T): Uint8Array;
export function encodeToBytes(data: BencodeEncodableValue): Uint8Array;
export function encodeToBytes(data: BencodeEncodableValue): Uint8Array {
	const encoder = new BencodeEncoder();

	return encoder.encode(data) as Uint8Array;
}

/**
 * Encodes JavaScript values into bencode format as a string.
 *
 * Produces bencode-encoded data according to the
 * {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * @param data - The value to encode. See {@link BencodeEncodableValue} for supported types.
 * @param options - Configuration options for encoding behavior.
 *   Use `options.encoding` to specify the character encoding (default: `'utf8'`).
 *   Supported encodings: `'utf8'`, `'utf-8'`, `'latin1'`, `'binary'`, `'ascii'`.
 *
 * @returns The bencode-encoded data as a string.
 *
 * @throws {BencodeEncodeError} With code `UNSUPPORTED_TYPE` if the value contains an
 *   unsupported type (e.g., functions, symbols, BigInt).
 * @throws {BencodeEncodeError} With code `CIRCULAR_REFERENCE` if the data contains
 *   circular references.
 *
 * @example
 * ```typescript
 * import { encodeToString } from 'bencodec';
 *
 * // Encode an integer
 * encodeToString(42);  // 'i42e'
 *
 * // Encode a string
 * encodeToString('hello');  // '5:hello'
 *
 * // Encode a dictionary
 * encodeToString({ foo: 'bar' });  // 'd3:foo3:bare'
 *
 * // Use latin1 encoding for binary data
 * encodeToString(new Uint8Array([0x00, 0xff]), { encoding: 'latin1' });  // '2:\x00\xff'
 *
 * // Specify encoding explicitly
 * encodeToString({ foo: 42 }, { encoding: 'utf8' });  // 'd3:fooi42ee'
 * ```
 *
 * @remarks
 * **Non-standard behaviors:**
 * - **Boolean encoding**: Booleans are encoded as integers (`true` → `i1e`, `false` → `i0e`).
 * - **Float truncation**: Floating-point numbers are truncated toward zero before encoding.
 * - **Null/undefined handling**: `null` and `undefined` values are silently skipped
 *   in lists and dictionaries. They cannot be encoded as top-level values.
 *
 * **Dictionary key sorting:**
 * Dictionary keys are automatically sorted lexicographically (by raw byte value)
 * to comply with the bencode specification.
 *
 * **Encoding note:**
 * For binary data containing non-UTF8 bytes, use `{ encoding: 'latin1' }` or `{ encoding: 'binary' }`
 * to preserve byte values in the output string.
 */
export function encodeToString<T extends object>(data: T, options?: IBencodeEncodeOptions): string;
export function encodeToString(data: BencodeEncodableValue, options?: IBencodeEncodeOptions): string;
export function encodeToString(data: BencodeEncodableValue, options?: IBencodeEncodeOptions): string {
	const encoding = options?.encoding ?? 'utf8';
	const encoder = new BencodeEncoder({ stringify: false });
	const bytes = encoder.encode(data) as Uint8Array;

	return Bytes.toString(bytes, encoding);
}

export const bencodec = { decode, encode, encodeToBytes, encodeToString };
export default bencodec;
