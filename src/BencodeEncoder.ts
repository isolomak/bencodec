import { BencodeEncodableDictionary, BencodeEncodableList, BencodeEncodableValue, FLAG, IBencodecOptions } from './types';
import { BencodeEncodeError, BencodeErrorCode } from './errors';
import { Bytes } from './bytes';

/**
 * Encoder for converting JavaScript values to bencode format.
 *
 * Produces bencode-encoded data according to the
 * {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * The encoder builds output by concatenating Uint8Array chunks for each bencode type,
 * then returns the result as a Uint8Array or string.
 *
 * @example
 * ```typescript
 * import { BencodeEncoder } from 'bencodec';
 *
 * // Basic usage
 * const encoder = new BencodeEncoder();
 * const result = encoder.encode({ announce: 'http://tracker.example.com' });
 *
 * // With options
 * const encoder = new BencodeEncoder({ stringify: true });
 * const result = encoder.encode([1, 2, 3]);  // 'li1ei2ei3ee'
 * ```
 *
 * @remarks
 * This class is used internally by the `encode()` function. For most use cases,
 * prefer using the `encode()` function directly. Use this class when you need
 * custom encoding logic or direct access to the encoder instance.
 *
 * **Supported JavaScript types:**
 * - `number` - Encoded as bencode integer (floats truncated toward zero)
 * - `boolean` - Encoded as bencode integer (`true` → `i1e`, `false` → `i0e`)
 * - `string` - Encoded as bencode string
 * - `Uint8Array` / `ArrayBuffer` / `ArrayBufferView` - Encoded as bencode string (raw bytes)
 * - `Array` - Encoded as bencode list
 * - `Object` - Encoded as bencode dictionary (keys auto-sorted)
 * - `null` / `undefined` - Silently skipped in lists and dictionaries
 *
 * **Error handling:**
 * - Circular references are detected and throw `CIRCULAR_REFERENCE` errors
 * - Unsupported types (functions, symbols, BigInt) throw `UNSUPPORTED_TYPE` errors
 */
export class BencodeEncoder {

	/** Bencode integer start marker: 'i' */
	private readonly _integerIdentifier = new Uint8Array([ FLAG.INTEGER ]);

	/** Bencode string delimiter: ':' */
	private readonly _stringDelimiterIdentifier = new Uint8Array([ FLAG.STR_DELIMITER ]);

	/** Bencode list start marker: 'l' */
	private readonly _listIdentifier = new Uint8Array([ FLAG.LIST ]);

	/** Bencode dictionary start marker: 'd' */
	private readonly _dictionaryIdentifier = new Uint8Array([ FLAG.DICTIONARY ]);

	/** Bencode end marker: 'e' */
	private readonly _endIdentifier = new Uint8Array([ FLAG.END ]);

	/** Accumulator for encoded data chunks */
	private readonly _buffer: Array<Uint8Array>;

	/** Encoding options */
	private readonly _options: IBencodecOptions;

	/** Tracks visited objects for circular reference detection */
	private readonly _visited: WeakSet<object>;

	/** Current path in the data structure for error reporting */
	private readonly _path: (string | number)[];

	/**
	 * Creates a new BencodeEncoder instance.
	 *
	 * @param options - Configuration options for encoding behavior.
	 *
	 * @example
	 * ```typescript
	 * // Default options (returns Uint8Array)
	 * const encoder = new BencodeEncoder();
	 *
	 * // Return string instead of Uint8Array
	 * const encoder = new BencodeEncoder({ stringify: true });
	 * ```
	 */
	public constructor(options?: IBencodecOptions) {
		this._buffer = [];
		this._options = options || { };
		this._visited = new WeakSet();
		this._path = [];
	}

	/**
	 * Encodes a JavaScript value to bencode format.
	 *
	 * @param data - The value to encode. See {@link BencodeEncodableValue} for supported types.
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
	 * const encoder = new BencodeEncoder();
	 *
	 * encoder.encode(42);              // Uint8Array [0x69, 0x34, 0x32, 0x65] ('i42e')
	 * encoder.encode('hello');         // Uint8Array [0x35, 0x3a, 0x68, 0x65, 0x6c, 0x6c, 0x6f] ('5:hello')
	 * encoder.encode([1, 2]);          // Uint8Array [...] ('li1ei2ee')
	 * encoder.encode({ a: 1 });        // Uint8Array [...] ('d1:ai1ee')
	 * ```
	 */
	public encode(data: BencodeEncodableValue): Uint8Array | string {
		this._encodeType(data);

		return this._options.stringify
			? Bytes.toString(Bytes.concat(this._buffer))
			: Bytes.concat(this._buffer);
	}

	/**
	 * Routes encoding to the appropriate type-specific method.
	 *
	 * Determines the JavaScript type of the input and calls the corresponding
	 * encoder method. Type detection order matters for correct handling of
	 * Uint8Array vs ArrayBufferView vs generic object.
	 *
	 * @param data - The value to encode.
	 * @throws {BencodeEncodeError} With code `UNSUPPORTED_TYPE` for unsupported types.
	 */
	private _encodeType(data: BencodeEncodableValue): void {
		if (Bytes.isBytes(data)) {
			return this._encodeBytes(data);
		}
		if (Array.isArray(data)) {
			return this._encodeList(data);
		}
		if (ArrayBuffer.isView(data)) {
			return this._encodeBytes(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
		}
		if (data instanceof ArrayBuffer) {
			return this._encodeBytes(new Uint8Array(data));
		}
		if (typeof data === 'boolean') {
			return this._encodeInteger(data ? 1 : 0);
		}
		if (typeof data === 'number') {
			return this._encodeInteger(data);
		}
		if (typeof data === 'string') {
			return this._encodeString(data);
		}
		if (typeof data === 'object') {
			return this._encodeDictionary(data as BencodeEncodableDictionary);
		}

		throw new BencodeEncodeError(
			BencodeErrorCode.UNSUPPORTED_TYPE,
			`${typeof data} is unsupported type.`,
			[ ...this._path ],
		);
	}

	/**
	 * Encodes a Uint8Array as a bencode string.
	 *
	 * Bencode strings are formatted as `<length>:<content>` where length is the
	 * byte length of the content.
	 *
	 * @param data - The Uint8Array to encode.
	 */
	private _encodeBytes(data: Uint8Array): void {
		this._buffer.push(
			Bytes.fromString(String(data.length)),
			this._stringDelimiterIdentifier,
			data,
		);
	}

	/**
	 * Encodes a JavaScript string as a bencode string.
	 *
	 * The string is converted to UTF-8 bytes and encoded as `<byte_length>:<utf8_bytes>`.
	 * Note that the length prefix is the byte length, not the character count.
	 *
	 * @param data - The string to encode.
	 */
	private _encodeString(data: string): void {
		const encoded = Bytes.fromString(data);
		this._buffer.push(
			Bytes.fromString(String(encoded.length)),
			this._stringDelimiterIdentifier,
			encoded,
		);
	}

	/**
	 * Encodes a number as a bencode integer.
	 *
	 * Bencode integers are formatted as `i<number>e`. Floating-point numbers are
	 * truncated toward zero (not rounded) before encoding.
	 *
	 * @param data - The number to encode.
	 */
	private _encodeInteger(data: number): void {
		this._buffer.push(
			this._integerIdentifier,
			Bytes.fromString(String(Math.trunc(data))),
			this._endIdentifier,
		);
	}

	/**
	 * Encodes a JavaScript array as a bencode list.
	 *
	 * Bencode lists are formatted as `l<items>e`. Elements are encoded in order.
	 * `null` and `undefined` values are silently skipped.
	 *
	 * Tracks visited objects to detect circular references.
	 *
	 * @param data - The array to encode.
	 * @throws {BencodeEncodeError} With code `CIRCULAR_REFERENCE` if the array was already visited.
	 */
	private _encodeList(data: BencodeEncodableList): void {
		if (this._visited.has(data)) {
			throw new BencodeEncodeError(
				BencodeErrorCode.CIRCULAR_REFERENCE,
				'Circular reference detected',
				[ ...this._path ],
			);
		}
		this._visited.add(data);

		this._buffer.push(this._listIdentifier);

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			if (item === null || item === undefined) {
				continue;
			}
			this._path.push(i);
			this._encodeType(item);
			this._path.pop();
		}

		this._buffer.push(this._endIdentifier);
		this._visited.delete(data);
	}

	/**
	 * Encodes a JavaScript object as a bencode dictionary.
	 *
	 * Bencode dictionaries are formatted as `d<key><value>...e`. Keys are automatically
	 * sorted lexicographically (by raw byte value) to comply with the bencode specification.
	 * Properties with `null` or `undefined` values are silently skipped.
	 *
	 * Tracks visited objects to detect circular references.
	 *
	 * @param data - The object to encode.
	 * @throws {BencodeEncodeError} With code `CIRCULAR_REFERENCE` if the object was already visited.
	 */
	private _encodeDictionary(data: BencodeEncodableDictionary): void {
		if (this._visited.has(data)) {
			throw new BencodeEncodeError(
				BencodeErrorCode.CIRCULAR_REFERENCE,
				'Circular reference detected',
				[ ...this._path ],
			);
		}
		this._visited.add(data);

		this._buffer.push(this._dictionaryIdentifier);

		const keys = Object.keys(data).sort();

		for (const key of keys) {
			if (data[key] === null || data[key] === undefined) {
				continue;
			}

			this._encodeString(key);
			this._path.push(key);
			this._encodeType(data[key]);
			this._path.pop();
		}

		this._buffer.push(this._endIdentifier);
		this._visited.delete(data);
	}

}
