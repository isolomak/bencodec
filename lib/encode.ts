import { EncodeTypes, FLAG } from './types';

export class BencodeEncoder {

	private _integerIdentifier = Buffer.from( [ FLAG.INTEGER ] );
	private _stringDelimiterIdentifier = Buffer.from( [ FLAG.STR_DELIMITER ] );
	private _listIdentifier = Buffer.from( [ FLAG.LIST ] );
	private _dictionaryIdentifier = Buffer.from( [ FLAG.DICTIONARY ] );
	private _endIdentifier = Buffer.from( [ FLAG.END ] );

	private readonly _buffer: Uint8Array[];
	private readonly _stringify: boolean;

	constructor(stringify: boolean = false) {
		this._buffer = [];
		this._stringify = stringify;
	}

	/**
	 * Encode data
	 */
	public encode(data: EncodeTypes) {
		this._encodeType(data);
		return this._stringify
			? Buffer.concat(this._buffer).toString('utf8')
			: Buffer.concat(this._buffer);

	}

	/**
	 * Encode data by type
	 */
	private _encodeType(data: EncodeTypes) {
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
			return this._encodeInteger(data as number);
		}
		if (typeof data === 'string') {
			return this._encodeString(data);
		}
		if (typeof data === 'object') {
			return this._encodeDictionary(data as { [ key: string ]: EncodeTypes });
		}

		throw new Error(`${typeof data} is unsupported type.`);

	}

	/**
	 * Encode buffer
	 */
	private _encodeBuffer(data: Buffer) {
		this._buffer.push(
			Buffer.from(String(data.length)),
			this._stringDelimiterIdentifier,
			data,
		);
	}

	/**
	 * Encode string
	 */
	private _encodeString(data: string) {
		this._buffer.push(
			Buffer.from(String(Buffer.byteLength(data))),
			this._stringDelimiterIdentifier,
			Buffer.from(data),
		);
	}

	/**
	 * Encode integer
	 */
	private _encodeInteger(data: number) {
		this._buffer.push(
			this._integerIdentifier,
			Buffer.from(String(Math.round(data))),
			this._endIdentifier,
		);
	}

	/**
	 * Encode list
	 */
	private _encodeList(data: Array<EncodeTypes>) {
		this._buffer.push( this._listIdentifier );

		for (let i = 0; i < data.length; i++) {
			if (data[i] === null || data[i] === undefined) {
				continue ;
			}
			this._encodeType(data[i]);
		}

		this._buffer.push( this._endIdentifier );
	}

	/**
	 * Encode dictionary
	 */
	private _encodeDictionary(data: { [ key: string ]: EncodeTypes }) {
		this._buffer.push( this._dictionaryIdentifier );

		const keys = Object.keys(data).sort();
		for (const key of keys) {
			if (data[key] === null || data[key] === undefined) {
				continue ;
			}
			this._encodeString(key);
			this._encodeType(data[key]);
		}

		this._buffer.push( this._endIdentifier );
	}

}

export function encode(data: EncodeTypes, stringify?: boolean) {
	return new BencodeEncoder(stringify).encode(data);
}
export default encode;
