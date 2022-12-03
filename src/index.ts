import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';
import { BencodeTypes, EncodeSupportedTypes, IBencodecOptions } from './types';


/**
 * Decode string or buffer
 */
export function decode(data: Buffer | string, options?: IBencodecOptions): BencodeTypes {
	const decoder = new BencodeDecoder(data, options);
	return decoder.decode();
}

/**
 * Encode data
 */
export function encode(data: EncodeSupportedTypes, options?: IBencodecOptions): Buffer | string {
	const encoder = new BencodeEncoder(options);
	return encoder.encode(data);
}

export const bencodec = { decode, encode };
export default bencodec;
