import { BencodeTypes, EncodeSupportedTypes, IBencodecOptions } from './types';
import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';

export function decode(data: Buffer | string, options?: IBencodecOptions): BencodeTypes {
	return new BencodeDecoder(data, options).decode();
}

export function encode(data: EncodeSupportedTypes, options?: IBencodecOptions): Buffer | string {
	return new BencodeEncoder(options).encode(data);
}

export const bencodec = { decode, encode };
export default bencodec;
