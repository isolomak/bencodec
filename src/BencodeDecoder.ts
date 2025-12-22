import { BencodeDictionary, BencodeList, BencodeTypes, FLAG, IBencodecOptions } from './types';
import { Buffer } from 'node:buffer';

export class BencodeDecoder {

	/**
	 * Check if character in integer
	 */
	private static _isInteger(char: number): boolean {
		return char >= 0x30 && char <= 0x39;
	}

	private _index: number;
	private readonly _buffer: Buffer;
	private readonly _options: IBencodecOptions;

	/**
	 * Constructor
	 */
	constructor(data: Buffer | string, options?: IBencodecOptions) {
		if (!data) {
			throw new Error('Nothing to decode');
		}

		this._index = 0;
		this._options = options || { };
		this._buffer = typeof data === 'string'
			? Buffer.from(data)
			: data;
	}

	/**
	 * Decode bencoded data
	 */
	public decode(): BencodeTypes {
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

		throw new Error('Invalid bencode data');
	}

	/**
	 * Get character by current index
	 */
	private _currentChar(): number {
		return this._buffer[this._index];
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
		const acc = [];

		for (let i = 0; i < length; i++) {
			acc.push(this._next());
		}

		return this._options.stringify
			? Buffer.from(acc).toString('utf8')
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
			throw new Error('Invalid bencode: leading zeros are not allowed');
		}

		while (BencodeDecoder._isInteger(this._currentChar()) || this._currentChar() === FLAG.DOT) {
			if (this._currentChar() === FLAG.DOT) {
				isFloat = true;
			}

			isFloat === false
				? integer = (integer * 10) + (this._next() - 0x30)
				: this._index++;
		}

		if (this._currentChar() === FLAG.END) {
			this._index++;
		}

		if (this._currentChar() === FLAG.STR_DELIMITER) {
			this._index++;
		}

		if (sign === -1 && integer === 0) {
			throw new Error('Invalid bencode: negative zero is not allowed');
		}

		return integer * sign;
	}

	/**
	 * Decode bencoded list
	 */
	private _decodeList(): BencodeList {
		const acc = [];
		// skip LIST flag
		this._next();

		while (this._currentChar() !== FLAG.END) {
			acc.push(this.decode());
		}
		// skip END flag
		this._next();

		return acc;
	}

	/**
	 * Decode bencoded dictionary
	 */
	private _decodeDictionary(): BencodeDictionary {
		const acc: BencodeDictionary = { };
		let prevKey: Buffer | null = null;
		// skip DICTIONARY flag
		this._next();

		while (this._currentChar() !== FLAG.END) {
			const key = this._decodeString();
			const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key);

			if (this._options.strict && prevKey !== null && Buffer.compare(prevKey, keyBuffer) >= 0) {
				throw new Error('Invalid bencode: dictionary keys must be in sorted order');
			}

			prevKey = keyBuffer;
			acc[key.toString()] = this.decode();
		}
		// skip END flag
		this._next();

		return acc;
	}

}
