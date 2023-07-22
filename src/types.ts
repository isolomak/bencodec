export interface IBencodecOptions {
	stringify?: boolean;
}

export enum FLAG {
	INTEGER = 0x69, // 'i'
	STR_DELIMITER = 0x3a, // ':'
	LIST = 0x6c, // 'l'
	DICTIONARY = 0x64, // 'd'
	END = 0x65, // 'e'
	MINUS = 0x2d, // '-'
	PLUS = 0x2b, // '+'
	DOT = 0x2e, // '.'
}

export type BencodeList = Array<BencodeTypes>;

export type BencodeDictionary = { [key: string]: BencodeTypes };

export type BencodeTypes = string | number | Buffer | BencodeDictionary | BencodeList | object;

export type EncodeSupportedTypes = BencodeTypes | ArrayBuffer | ArrayBufferView | Boolean;
