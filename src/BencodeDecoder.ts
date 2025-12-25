import { BencodeDecodedDictionary, BencodeDecodedList, BencodeDecodedValue, FLAG, IBencodecOptions } from './types';
import { BencodeDecodeError, BencodeErrorCode } from './errors';
import { Bytes } from './bytes';

/**
 * Stateful decoder for bencode-formatted data.
 *
 * Parses bencode data by walking through a buffer and extracting values according to
 * the {@link https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding | BitTorrent specification}.
 *
 * The decoder maintains an internal position pointer that advances as data is parsed.
 * This allows for streaming-style decoding and detection of trailing data.
 *
 * @example
 * ```typescript
 * import { BencodeDecoder } from 'bencodec';
 *
 * // Basic usage
 * const decoder = new BencodeDecoder('d3:fooi42ee');
 * const result = decoder.decode();  // { foo: 42 }
 *
 * // Check for trailing data
 * if (decoder.hasRemainingData()) {
 *   console.log('Warning: extra data after bencode value');
 * }
 *
 * // With options
 * const decoder = new BencodeDecoder(buffer, {
 *   stringify: true,
 *   maxDepth: 100,
 *   maxStringLength: 1024 * 1024
 * });
 * ```
 *
 * @remarks
 * This class is used internally by the `decode()` function. For most use cases,
 * prefer using the `decode()` function directly. Use this class when you need:
 * - Access to the current buffer position
 * - Detection of remaining data after decoding
 * - Custom decoding logic
 *
 * **Supported bencode types:**
 * - Integers: `i<number>e` (e.g., `i42e`, `i-17e`)
 * - Strings: `<length>:<content>` (e.g., `5:hello`)
 * - Lists: `l<items>e` (e.g., `li1ei2ee`)
 * - Dictionaries: `d<key><value>...e` (e.g., `d3:fooi42ee`)
 *
 * **Non-standard extensions handled:**
 * - Plus signs in integers are silently ignored (`i+42e` → `42`)
 * - Decimal points cause truncation (`i3.14e` → `3`)
 */
export class BencodeDecoder {

	/**
	 * Checks if a byte value represents an ASCII digit (0-9).
	 *
	 * @param char - The byte value to check
	 * @returns `true` if the byte is an ASCII digit (0x30-0x39)
	 */
	private static _isInteger(char: number): boolean {
		return char >= 0x30 && char <= 0x39;
	}

	/** Current position in the buffer */
	private _index: number;

	/** Current nesting depth for lists and dictionaries */
	private _currentDepth: number;

	/** The buffer containing bencode data to decode */
	private readonly _buffer: Uint8Array;

	/** Decoding options */
	private readonly _options: IBencodecOptions;

	/**
	 * Creates a new BencodeDecoder instance.
	 *
	 * @param data - The bencode data to decode. Strings are converted to Uint8Array internally.
	 * @param options - Configuration options for decoding behavior.
	 *
	 * @throws {BencodeDecodeError} With code `EMPTY_INPUT` if data is empty or falsy.
	 *
	 * @example
	 * ```typescript
	 * // From string
	 * const decoder = new BencodeDecoder('i42e');
	 *
	 * // From Uint8Array
	 * const decoder = new BencodeDecoder(new Uint8Array([0x69, 0x34, 0x32, 0x65]));
	 *
	 * // With options
	 * const decoder = new BencodeDecoder(data, { stringify: true, strict: true });
	 * ```
	 */
	public constructor(data: Uint8Array | string, options?: IBencodecOptions) {
		if (!data) {
			throw new BencodeDecodeError(BencodeErrorCode.EMPTY_INPUT, 'Nothing to decode');
		}

		this._index = 0;
		this._currentDepth = 0;
		this._options = options || { };
		this._buffer = typeof data === 'string'
			? Bytes.fromString(data)
			: data;
	}

	/**
	 * Checks if there is remaining data in the buffer after decoding.
	 *
	 * Useful for detecting trailing garbage data, which may indicate malformed input
	 * or concatenated bencode values.
	 *
	 * @returns `true` if the current position is before the end of the buffer.
	 *
	 * @example
	 * ```typescript
	 * const decoder = new BencodeDecoder('i42eextra');
	 * decoder.decode();  // 42
	 * decoder.hasRemainingData();  // true (5 bytes remaining: "extra")
	 * ```
	 */
	public hasRemainingData(): boolean {
		return this._index < this._buffer.length;
	}

	/**
	 * Gets the current byte position in the buffer.
	 *
	 * Useful for error reporting, debugging, or implementing custom parsing logic.
	 *
	 * @returns The zero-based byte offset of the current position.
	 *
	 * @example
	 * ```typescript
	 * const decoder = new BencodeDecoder('i42e5:hello');
	 * decoder.decode();  // 42
	 * decoder.getCurrentPosition();  // 4 (after 'i42e')
	 * decoder.decode();  // <Buffer 68 65 6c 6c 6f>
	 * decoder.getCurrentPosition();  // 11 (end of buffer)
	 * ```
	 */
	public getCurrentPosition(): number {
		return this._index;
	}

	/**
	 * Decodes the next bencode value from the buffer.
	 *
	 * Advances the internal position pointer past the decoded value.
	 * Can be called multiple times to decode concatenated bencode values.
	 *
	 * @returns The decoded JavaScript value:
	 *   - Bencode integers → `number`
	 *   - Bencode strings → `Uint8Array` (default) or `string` (if `stringify: true`)
	 *   - Bencode lists → `BencodeDecodedList`
	 *   - Bencode dictionaries → `BencodeDecodedDictionary`
	 *
	 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if the buffer ends unexpectedly.
	 * @throws {BencodeDecodeError} With code `INVALID_FORMAT` if an invalid type marker is found.
	 * @throws {BencodeDecodeError} With code `LEADING_ZEROS` if an integer has leading zeros.
	 * @throws {BencodeDecodeError} With code `NEGATIVE_ZERO` if negative zero is encountered.
	 * @throws {BencodeDecodeError} With code `UNSORTED_KEYS` if `strict: true` and dictionary
	 *   keys are not in lexicographic order.
	 * @throws {BencodeDecodeError} With code `MAX_SIZE_EXCEEDED` if a string exceeds `maxStringLength`.
	 * @throws {BencodeDecodeError} With code `MAX_DEPTH_EXCEEDED` if nesting exceeds `maxDepth`.
	 *
	 * @example
	 * ```typescript
	 * const decoder = new BencodeDecoder('i42e');
	 * const value = decoder.decode();  // 42
	 *
	 * // Decode multiple values
	 * const decoder = new BencodeDecoder('i1ei2ei3e');
	 * while (!decoder.hasRemainingData() === false) {
	 *   console.log(decoder.decode());  // 1, 2, 3
	 * }
	 * ```
	 */
	public decode(): BencodeDecodedValue {
		if (this._isEOF()) {
			throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, 'Unexpected end of data');
		}

		if (BencodeDecoder._isInteger(this._currentChar())) {
			return this._decodeString();
		}

		if (this._currentChar() === FLAG.INTEGER) {
			return this._decodeInteger();
		}

		if (this._currentChar() === FLAG.LIST) {
			return this._decodeList();
		}

		if (this._currentChar() === FLAG.DICTIONARY) {
			return this._decodeDictionary();
		}

		throw this._decodeError(BencodeErrorCode.INVALID_FORMAT, 'Invalid bencode data');
	}

	/**
	 * Gets the byte at the current buffer position without advancing.
	 *
	 * @returns The byte value at the current position.
	 */
	private _currentChar(): number {
		return this._buffer[this._index];
	}

	/**
	 * Checks if the current position has reached or exceeded the buffer length.
	 *
	 * @returns `true` if at or past end of buffer.
	 */
	private _isEOF(): boolean {
		return this._index >= this._buffer.length;
	}

	/**
	 * Formats a byte value for display in error messages.
	 *
	 * Printable ASCII characters (0x20-0x7e) are shown as quoted characters.
	 * Non-printable bytes are shown as hex values.
	 *
	 * @param char - The byte value to format.
	 * @returns A human-readable string representation.
	 */
	private static _formatChar(char: number): string {
		if (char === undefined || char === null) {
			return 'undefined';
		}
		if (char >= 0x20 && char <= 0x7e) {
			return `'${String.fromCharCode(char)}'`;
		}

		return `0x${char.toString(16).padStart(2, '0')}`;
	}

	/**
	 * Creates a decode error with position context.
	 *
	 * Appends the current buffer position and (if not at EOF) the current character
	 * to the error message for debugging.
	 *
	 * @param code - The error code identifying the error type.
	 * @param message - The base error message.
	 * @returns A BencodeDecodeError with position information.
	 */
	private _decodeError(code: BencodeErrorCode, message: string): BencodeDecodeError {
		let fullMessage: string;
		if (this._isEOF()) {
			fullMessage = `${message} at position ${this._index}`;
		}
		else {
			fullMessage = `${message} at position ${this._index} (found ${BencodeDecoder._formatChar(this._currentChar())})`;
		}

		return new BencodeDecodeError(code, fullMessage, this._index);
	}

	/**
	 * Gets the byte at the current position and advances to the next position.
	 *
	 * @returns The byte value at the current position before advancing.
	 */
	private _next(): number {
		return this._buffer[this._index++];
	}

	/**
	 * Decodes a bencode string value.
	 *
	 * Bencode strings are formatted as `<length>:<content>` where length is a
	 * non-negative integer. The content is returned as a Uint8Array by default,
	 * or as a string if the `stringify` option is enabled.
	 *
	 * @returns The decoded string as a Uint8Array or string.
	 * @throws {BencodeDecodeError} With code `MAX_SIZE_EXCEEDED` if length exceeds `maxStringLength`.
	 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if buffer doesn't contain enough bytes.
	 */
	private _decodeString(): Uint8Array | string {
		const length = this._decodeInteger();

		if (this._options.maxStringLength && length > this._options.maxStringLength) {
			throw new BencodeDecodeError(BencodeErrorCode.MAX_SIZE_EXCEEDED, `String length ${length} exceeds maximum ${this._options.maxStringLength}`, this._index);
		}

		if (this._index + length > this._buffer.length) {
			throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, `Unexpected end of data: expected ${length} bytes for string`);
		}

		const bytes = new Uint8Array(length);

		for (let i = 0; i < length; i++) {
			bytes[i] = this._next();
		}

		return this._options.stringify
			? Bytes.toString(bytes, this._options.encoding || 'utf8')
			: bytes;
	}

	/**
	 * Decodes a bencode integer value or string length prefix.
	 *
	 * Bencode integers are formatted as `i<number>e` (e.g., `i42e`, `i-17e`).
	 * String length prefixes are just digits followed by `:` (e.g., `5:`).
	 *
	 * **Non-standard extensions:**
	 * - A leading `+` sign is silently ignored (`i+42e` → `42`)
	 * - Decimal points cause the fractional part to be discarded (`i3.14e` → `3`)
	 *
	 * @returns The decoded integer value.
	 * @throws {BencodeDecodeError} With code `LEADING_ZEROS` if the integer has leading zeros.
	 * @throws {BencodeDecodeError} With code `NEGATIVE_ZERO` if negative zero is encountered.
	 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if the terminating `e` is missing.
	 */
	private _decodeInteger(): number {
		let sign = 1;
		let isFloat = false;
		let integer = 0;
		let isBencodeInteger = false;

		if (this._currentChar() === FLAG.INTEGER) {
			this._index++;
			isBencodeInteger = true;
		}

		if (this._currentChar() === FLAG.PLUS) {
			this._index++;
		}

		if (this._currentChar() === FLAG.MINUS) {
			this._index++;
			sign = -1;
		}

		// Check for leading zeros (only for bencode integers, not string lengths)
		if (isBencodeInteger && this._currentChar() === 0x30 && BencodeDecoder._isInteger(this._buffer[this._index + 1])) {
			throw this._decodeError(BencodeErrorCode.LEADING_ZEROS, 'Invalid bencode: leading zeros are not allowed');
		}

		while (BencodeDecoder._isInteger(this._currentChar()) || this._currentChar() === FLAG.DOT) {
			if (this._currentChar() === FLAG.DOT) {
				isFloat = true;
			}

			isFloat === false
				? integer = (integer * 10) + (this._next() - 0x30)
				: this._index++;
		}

		if (isBencodeInteger) {
			if (this._isEOF() || this._currentChar() !== FLAG.END) {
				throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, 'Unexpected end of data: expected \'e\' to terminate integer');
			}
			this._index++;
		}
		else if (this._currentChar() === FLAG.STR_DELIMITER) {
			this._index++;
		}

		if (sign === -1 && integer === 0) {
			throw this._decodeError(BencodeErrorCode.NEGATIVE_ZERO, 'Invalid bencode: negative zero is not allowed');
		}

		return integer * sign;
	}

	/**
	 * Decodes a bencode list value.
	 *
	 * Bencode lists are formatted as `l<items>e` where items are any valid
	 * bencode values. Lists can be nested and contain mixed types.
	 *
	 * @returns The decoded list as a JavaScript array.
	 * @throws {BencodeDecodeError} With code `MAX_DEPTH_EXCEEDED` if nesting exceeds `maxDepth`.
	 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if the terminating `e` is missing.
	 */
	private _decodeList(): BencodeDecodedList {
		this._currentDepth++;
		if (this._options.maxDepth && this._currentDepth > this._options.maxDepth) {
			throw new BencodeDecodeError(BencodeErrorCode.MAX_DEPTH_EXCEEDED, `Nesting depth ${this._currentDepth} exceeds maximum ${this._options.maxDepth}`, this._index);
		}

		const acc = [];
		// skip LIST flag
		this._next();

		while (!this._isEOF() && this._currentChar() !== FLAG.END) {
			acc.push(this.decode());
		}

		if (this._isEOF()) {
			this._currentDepth--;
			throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, 'Unexpected end of data: expected \'e\' to terminate list');
		}
		// skip END flag
		this._next();
		this._currentDepth--;

		return acc;
	}

	/**
	 * Decodes a bencode dictionary value.
	 *
	 * Bencode dictionaries are formatted as `d<key><value>...e` where keys are
	 * bencode strings and values are any valid bencode values. According to the
	 * specification, keys must be in sorted lexicographic order, but this is only
	 * enforced when `strict: true`.
	 *
	 * @returns The decoded dictionary as a JavaScript object.
	 * @throws {BencodeDecodeError} With code `MAX_DEPTH_EXCEEDED` if nesting exceeds `maxDepth`.
	 * @throws {BencodeDecodeError} With code `UNSORTED_KEYS` if `strict: true` and keys are not sorted.
	 * @throws {BencodeDecodeError} With code `UNEXPECTED_END` if the terminating `e` is missing.
	 */
	private _decodeDictionary(): BencodeDecodedDictionary {
		this._currentDepth++;
		if (this._options.maxDepth && this._currentDepth > this._options.maxDepth) {
			throw new BencodeDecodeError(BencodeErrorCode.MAX_DEPTH_EXCEEDED, `Nesting depth ${this._currentDepth} exceeds maximum ${this._options.maxDepth}`, this._index);
		}

		const acc: BencodeDecodedDictionary = { };
		let prevKey: Uint8Array | null = null;
		// skip DICTIONARY flag
		this._next();

		while (!this._isEOF() && this._currentChar() !== FLAG.END) {
			const key = this._decodeString();
			const keyBytes = Bytes.isBytes(key) ? key : Bytes.fromString(key);

			if (this._options.strict && prevKey !== null && Bytes.compare(prevKey, keyBytes) >= 0) {
				const keyStr = typeof key === 'string' ? key : Bytes.toString(key);
				const prevKeyStr = Bytes.toString(prevKey);
				throw this._decodeError(BencodeErrorCode.UNSORTED_KEYS, `Invalid bencode: dictionary keys must be in sorted order (key '${keyStr}' after '${prevKeyStr}')`);
			}

			prevKey = keyBytes;
			acc[typeof key === 'string' ? key : Bytes.toString(key)] = this.decode();
		}

		if (this._isEOF()) {
			this._currentDepth--;
			throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, 'Unexpected end of data: expected \'e\' to terminate dictionary');
		}
		// skip END flag
		this._next();
		this._currentDepth--;

		return acc;
	}

}
