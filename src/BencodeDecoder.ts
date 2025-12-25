import { BencodeDecodedDictionary, BencodeDecodedList, BencodeDecodedValue, FLAG, IBencodecOptions } from './types';
import { BencodeDecodeError, BencodeErrorCode } from './errors';
import { Buffer } from 'node:buffer';

export class BencodeDecoder {

	/**
	 * Check if character in integer
	 */
	private static _isInteger(char: number): boolean {
		return char >= 0x30 && char <= 0x39;
	}

	private _index: number;
	private _currentDepth: number;
	private readonly _buffer: Buffer;
	private readonly _options: IBencodecOptions;

	/**
	 * Constructor
	 */
	constructor(data: Buffer | string, options?: IBencodecOptions) {
		if (!data) {
			throw new BencodeDecodeError(BencodeErrorCode.EMPTY_INPUT, 'Nothing to decode');
		}

		this._index = 0;
		this._currentDepth = 0;
		this._options = options || { };
		this._buffer = typeof data === 'string'
			? Buffer.from(data)
			: data;
	}

	/**
	 * Check if there is remaining data in the buffer after decoding
	 */
	public hasRemainingData(): boolean {
		return this._index < this._buffer.length;
	}

	/**
	 * Get current position in the buffer for error reporting
	 */
	public getCurrentPosition(): number {
		return this._index;
	}

	/**
	 * Decode bencoded data
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
	 * Get character by current index
	 */
	private _currentChar(): number {
		return this._buffer[this._index];
	}

	/**
	 * Check if we've reached the end of the buffer
	 */
	private _isEOF(): boolean {
		return this._index >= this._buffer.length;
	}

	/**
	 * Format character for error message (printable or hex)
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
	 * Create decode error with position context
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
	 * Get character by current index and increment
	 */
	private _next(): number {
		return this._buffer[this._index++];
	}

	/**
	 * Decode bencoded string
	 */
	private _decodeString(): Buffer | string {
		const length = this._decodeInteger();

		if (this._options.maxStringLength && length > this._options.maxStringLength) {
			throw new BencodeDecodeError(BencodeErrorCode.MAX_SIZE_EXCEEDED, `String length ${length} exceeds maximum ${this._options.maxStringLength}`, this._index);
		}

		if (this._index + length > this._buffer.length) {
			throw this._decodeError(BencodeErrorCode.UNEXPECTED_END, `Unexpected end of data: expected ${length} bytes for string`);
		}

		const acc = [];

		for (let i = 0; i < length; i++) {
			acc.push(this._next());
		}

		return this._options.stringify
			? Buffer.from(acc).toString(this._options.encoding || 'utf8')
			: Buffer.from(acc);
	}

	/**
	 * Decode bencoded integer
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
	 * Decode bencoded list
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
	 * Decode bencoded dictionary
	 */
	private _decodeDictionary(): BencodeDecodedDictionary {
		this._currentDepth++;
		if (this._options.maxDepth && this._currentDepth > this._options.maxDepth) {
			throw new BencodeDecodeError(BencodeErrorCode.MAX_DEPTH_EXCEEDED, `Nesting depth ${this._currentDepth} exceeds maximum ${this._options.maxDepth}`, this._index);
		}

		const acc: BencodeDecodedDictionary = { };
		let prevKey: Buffer | null = null;
		// skip DICTIONARY flag
		this._next();

		while (!this._isEOF() && this._currentChar() !== FLAG.END) {
			const key = this._decodeString();
			const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key);

			if (this._options.strict && prevKey !== null && Buffer.compare(prevKey, keyBuffer) >= 0) {
				throw this._decodeError(BencodeErrorCode.UNSORTED_KEYS, `Invalid bencode: dictionary keys must be in sorted order (key '${key.toString()}' after '${prevKey.toString()}')`);
			}

			prevKey = keyBuffer;
			acc[key.toString()] = this.decode();
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
