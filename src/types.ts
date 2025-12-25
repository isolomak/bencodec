import { Buffer } from 'node:buffer';

export interface IBencodecOptions {
	stringify?: boolean;
	strict?: boolean;
	encoding?: BufferEncoding;
	maxStringLength?: number;
	maxDepth?: number;
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

// Decoder output types (strict)
export type BencodeDecodedList = Array<BencodeDecodedValue>;

export type BencodeDecodedDictionary = { [key: string]: BencodeDecodedValue };

export type BencodeDecodedValue = number | Buffer | string | BencodeDecodedList | BencodeDecodedDictionary;

// Encoder input types (permissive)
export type BencodeEncodableList = Array<BencodeEncodableValue>;

export type BencodeEncodableDictionary = { [key: string]: BencodeEncodableValue };

export type BencodeEncodableValue = number
	| boolean
	| string
	| Buffer
	| ArrayBuffer
	| ArrayBufferView
	| BencodeEncodableList
	| BencodeEncodableDictionary
	| null
	| undefined;
