import { BencodeDictionary, BencodeList, EncodeSupportedTypes, FLAG, IBencodecOptions } from './types';
import { Buffer } from 'node:buffer';

export class BencodeEncoder {

	private _integerIdentifier = Buffer.from([ FLAG.INTEGER ]);
	private _stringDelimiterIdentifier = Buffer.from([ FLAG.STR_DELIMITER ]);
	private _listIdentifier = Buffer.from([ FLAG.LIST ]);
	private _dictionaryIdentifier = Buffer.from([ FLAG.DICTIONARY ]);
	private _endIdentifier = Buffer.from([ FLAG.END ]);

	private readonly _buffer: Array<Uint8Array>;
	private readonly _options: IBencodecOptions;
	private readonly _visited: WeakSet<object>;

	/**
	 * Constructor
	 */
	constructor(options?: IBencodecOptions) {
		this._buffer = [];
		this._options = options || { };
		this._visited = new WeakSet();
	}

	/**
	 * Encode data
	 */
	public encode(data: EncodeSupportedTypes): Buffer | string {
		this._encodeType(data);

		return this._options.stringify
			? Buffer.concat(this._buffer).toString('utf8')
			: Buffer.concat(this._buffer);
	}

	/**
	 * Encode data by type
	 */
	private _encodeType(data: EncodeSupportedTypes): void {
		if (Buffer.isBuffer(data)) {
			return this._encodeBuffer(data);
		}
		if (Array.isArray(data)) {
			return this._encodeList(data);
		}
		if (ArrayBuffer.isView(data)) {
			return this._encodeBuffer(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
		}
		if (data instanceof ArrayBuffer) {
			return this._encodeBuffer(Buffer.from(data));
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
			return this._encodeDictionary(data as BencodeDictionary);
		}

		throw new Error(`${typeof data} is unsupported type.`);
	}

	/**
	 * Encode buffer
	 */
	private _encodeBuffer(data: Buffer): void {
		this._buffer.push(
			Buffer.from(String(data.length)),
			this._stringDelimiterIdentifier,
			data,
		);
	}

	/**
	 * Encode string
	 */
	private _encodeString(data: string): void {
		this._buffer.push(
			Buffer.from(String(Buffer.byteLength(data))),
			this._stringDelimiterIdentifier,
			Buffer.from(data),
		);
	}

	/**
	 * Encode integer (floats are truncated toward zero)
	 */
	private _encodeInteger(data: number): void {
		this._buffer.push(
			this._integerIdentifier,
			Buffer.from(String(Math.trunc(data))),
			this._endIdentifier,
		);
	}

	/**
	 * Encode list
	 */
	private _encodeList(data: BencodeList): void {
		if (this._visited.has(data)) {
			throw new Error('Circular reference detected');
		}
		this._visited.add(data);

		this._buffer.push(this._listIdentifier);

		for (const item of data) {
			if (item === null || item === undefined) {
				continue;
			}
			this._encodeType(item);
		}

		this._buffer.push(this._endIdentifier);
		this._visited.delete(data);
	}

	/**
	 * Encode dictionary
	 */
	private _encodeDictionary(data: BencodeDictionary): void {
		if (this._visited.has(data)) {
			throw new Error('Circular reference detected');
		}
		this._visited.add(data);

		this._buffer.push(this._dictionaryIdentifier);

		const keys = Object.keys(data).sort();

		for (const key of keys) {
			if (data[key] === null || data[key] === undefined) {
				continue;
			}

			this._encodeString(key);
			this._encodeType(data[key]);
		}

		this._buffer.push(this._endIdentifier);
		this._visited.delete(data);
	}

}
