import { BencodeDecoder } from './BencodeDecoder';
import { BencodeEncoder } from './BencodeEncoder';
import { BencodeEncodableValue, IBencodecOptions } from './types';
import { BencodeDecodeError, BencodeErrorCode } from './errors';
import { Buffer } from 'node:buffer';

export * from './types';
export * from './errors';

/**
 * Decode string or buffer
 */
export function decode<Type = unknown>(data: Buffer | string, options?: IBencodecOptions): Type {
	const decoder = new BencodeDecoder(data, options);
	const result = decoder.decode();

	if (options?.strict && decoder.hasRemainingData()) {
		throw new BencodeDecodeError(BencodeErrorCode.TRAILING_DATA, 'Invalid bencode: unexpected data after valid bencode');
	}

	return result as Type;
}

/**
 * Encode data
 */
export function encode(data: BencodeEncodableValue, options?: IBencodecOptions): Buffer | string {
	const encoder = new BencodeEncoder(options);

	return encoder.encode(data);
}

export const bencodec = { decode, encode };
export default bencodec;
