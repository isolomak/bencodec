import { BencodeDictionary, BencodeList, BencodeTypes, FLAG } from './types';

export class BencodeDecoder {

	/**
	 * Check if character in integer
	 */
	private static _isInteger(char: number): boolean {
		return char >= 0x30 && char <= 0x39;
	}

	private _index: number;
	private readonly _stringify: boolean;
	private readonly _buffer: Buffer;

	/**
	 * Constructor
	 */
	constructor(data: Buffer | string, stringify: boolean = false) {
		if (!data) {
			throw new Error('Nothing to decode');
		}

		this._index = 0;
		this._stringify = stringify;
		this._buffer = typeof data === 'string' ? Buffer.from(data) : data;
	}

	/**
	 * Decode bencoded data
	 */
	public decode(): BencodeTypes {
		if (BencodeDecoder._isInteger( this._currentChar() )) {
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
			acc.push( this._next() );
		}

		return this._stringify
			? Buffer.from(acc).toString('utf8')
			: Buffer.from(acc);
	}

	/**
	 * Decode bencoded integer
	 */
	private _decodeInteger(): number {
		let sign = 1;
		let float = false;
		let number = 0;

		if (this._currentChar() === FLAG.INTEGER) {
			this._index++;
		}

		if (this._currentChar() === FLAG.PLUS) {
			this._index++;
		}

		if (this._currentChar() === FLAG.MINUS) {
			this._index++;
			sign = -1;
		}

		while (BencodeDecoder._isInteger(this._currentChar()) || this._currentChar() === FLAG.DOT) {
			if (this._currentChar() === FLAG.DOT) {
				float = true;
			}

			float === false
				? number = number * 10 + (this._next() - 0x30)
				: this._index++;
		}

		if (this._currentChar() === FLAG.END) {
			this._index++;
		}

		if (this._currentChar() === FLAG.STR_DELIMITER) {
			this._index++;
		}

		return number * sign;
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
		const acc: BencodeDictionary = {};
		// skip DICTIONARY flag
		this._next();

		while (this._currentChar() !== FLAG.END) {
			const key = this._decodeString();
			acc[key.toString()] = this.decode();
		}
		// skip END flag
		this._next();

		return acc;
	}

}

export function decode(data: Buffer | string, stringify?: boolean): BencodeTypes {
	return new BencodeDecoder(data, stringify).decode();
}
export default decode;
