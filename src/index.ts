import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';
import { BencodeEncodableValue, IBencodecOptions } from './types';
import { BencodeDecodeError, BencodeErrorCode } from './errors';
import { Buffer } from 'node:buffer';

export * from './types';
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
 * @param data - The bencode data to decode. Can be a Buffer or a string (which will be
 *   converted to a Buffer internally).
 * @param options - Configuration options for decoding behavior.
 *
 * @returns The decoded JavaScript value. The return type depends on the bencode data:
 *   - Bencode integers → `number`
 *   - Bencode strings → `Buffer` (default) or `string` (if `stringify: true`)
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
 * // Decode a string (returns Buffer by default)
 * decode('5:hello');  // <Buffer 68 65 6c 6c 6f>
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
export function decode<Type = unknown>(data: Buffer | string, options?: IBencodecOptions): Type {
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
 * @param data - The value to encode. See {@link BencodeEncodableValue} for supported types.
 * @param options - Configuration options for encoding behavior.
 *
 * @returns The bencode-encoded data as a Buffer (default) or string (if `stringify: true`).
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
 * encode(42);  // <Buffer 69 34 32 65> ('i42e')
 *
 * // Encode a string
 * encode('hello');  // <Buffer 35 3a 68 65 6c 6c 6f> ('5:hello')
 *
 * // Encode a list
 * encode([1, 2, 3]);  // 'li1ei2ei3ee'
 *
 * // Encode a dictionary (keys are auto-sorted)
 * encode({ z: 1, a: 2 });  // 'd1:ai2e1:zi1ee' (keys sorted: a, z)
 *
 * // Get result as string instead of Buffer
 * encode({ foo: 'bar' }, { stringify: true });  // 'd3:foo3:bare'
 *
 * // Encode binary data
 * encode(Buffer.from([0x00, 0xff]));  // '2:\x00\xff'
 * encode(new Uint8Array([1, 2, 3]));  // '3:\x01\x02\x03'
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
export function encode(data: BencodeEncodableValue, options?: IBencodecOptions): Buffer | string {
	const encoder = new BencodeEncoder(options);

	return encoder.encode(data);
}

export const bencodec = { decode, encode };
export default bencodec;
