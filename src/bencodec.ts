import { BencodeTypes, EncodeSupportedTypes } from './types';
import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';

export function decode(data: Buffer | string, stringify?: boolean): BencodeTypes {
	return new BencodeDecoder(data, stringify).decode();
}

export function encode(data: EncodeSupportedTypes, stringify?: boolean): Buffer | string {
	return new BencodeEncoder(stringify).encode(data);
}

export const bencodec = { decode, encode };
export default bencodec;
