import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';
import { EncodeSupportedTypes, IBencodecOptions } from './types';
import { Buffer } from 'node:buffer';

export * from './types';

/**
 * Decode string or buffer
 */
export function decode<Type = unknown>(data: Buffer | string, options?: IBencodecOptions): Type {
	const decoder = new BencodeDecoder(data, options);
	const result = decoder.decode();

	if (options?.strict && decoder.hasRemainingData()) {
		throw new Error('Invalid bencode: unexpected data after valid bencode');
	}

	return result as Type;
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
