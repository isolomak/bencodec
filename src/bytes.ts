/**
 * Supported character encodings for byte/string conversions.
 * Limited set for cross-platform compatibility.
 */
export type ByteEncoding = 'utf8' | 'utf-8' | 'latin1' | 'binary' | 'ascii';

/**
 * Cross-platform utility class for byte array operations.
 * Replaces Node.js Buffer APIs with Uint8Array-based equivalents
 * that work in all JavaScript runtimes (Node.js, browsers, Deno, Bun).
 */
export class Bytes {

	private static readonly _encoder = new TextEncoder();
	private static readonly _decoder = new TextDecoder();

	/**
	 * Convert a string to Uint8Array using the specified encoding.
	 *
	 * @param str - The string to convert
	 * @param encoding - Character encoding (default: 'utf8')
	 * @returns Uint8Array containing the encoded bytes
	 *
	 * @example
	 * ```typescript
	 * Bytes.fromString('hello');           // UTF-8 encoded
	 * Bytes.fromString('hello', 'latin1'); // Latin-1 encoded
	 * ```
	 */
	public static fromString(str: string, encoding: ByteEncoding = 'utf8'): Uint8Array {
		if (encoding === 'utf8' || encoding === 'utf-8') {
			return Bytes._encoder.encode(str);
		}

		// latin1, binary, ascii - single byte per character
		const bytes = new Uint8Array(str.length);
		for (let i = 0; i < str.length; i++) {
			bytes[i] = str.charCodeAt(i) & 0xff;
		}

		return bytes;
	}

	/**
	 * Convert Uint8Array to string using the specified encoding.
	 *
	 * @param bytes - The byte array to convert
	 * @param encoding - Character encoding (default: 'utf8')
	 * @returns The decoded string
	 *
	 * @example
	 * ```typescript
	 * Bytes.toString(bytes);           // UTF-8 decoded
	 * Bytes.toString(bytes, 'latin1'); // Latin-1 decoded
	 * ```
	 */
	public static toString(bytes: Uint8Array, encoding: ByteEncoding = 'utf8'): string {
		if (encoding === 'utf8' || encoding === 'utf-8') {
			return Bytes._decoder.decode(bytes);
		}

		// latin1, binary, ascii - single byte per character
		let result = '';
		for (let i = 0; i < bytes.length; i++) {
			result += String.fromCharCode(bytes[i]);
		}

		return result;
	}

	/**
	 * Concatenate multiple Uint8Arrays into a single Uint8Array.
	 *
	 * @param arrays - Array of Uint8Arrays to concatenate
	 * @returns A new Uint8Array containing all bytes
	 *
	 * @example
	 * ```typescript
	 * const combined = Bytes.concat([bytes1, bytes2, bytes3]);
	 * ```
	 */
	public static concat(arrays: Uint8Array[]): Uint8Array {
		let totalLength = 0;
		for (const arr of arrays) {
			totalLength += arr.length;
		}

		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const arr of arrays) {
			result.set(arr, offset);
			offset += arr.length;
		}

		return result;
	}

	/**
	 * Compare two Uint8Arrays lexicographically.
	 *
	 * @param a - First byte array
	 * @param b - Second byte array
	 * @returns -1 if a < b, 0 if a === b, 1 if a > b
	 *
	 * @example
	 * ```typescript
	 * Bytes.compare(a, b); // -1, 0, or 1
	 * ```
	 */
	public static compare(a: Uint8Array, b: Uint8Array): number {
		const minLength = Math.min(a.length, b.length);

		for (let i = 0; i < minLength; i++) {
			if (a[i] < b[i]) {
				return -1;
			}
			if (a[i] > b[i]) {
				return 1;
			}
		}

		if (a.length < b.length) {
			return -1;
		}
		if (a.length > b.length) {
			return 1;
		}

		return 0;
	}

	/**
	 * Calculate the byte length of a string when encoded as UTF-8.
	 *
	 * @param str - The string to measure
	 * @returns The byte length in UTF-8 encoding
	 *
	 * @example
	 * ```typescript
	 * Bytes.byteLength('hello'); // 5
	 * Bytes.byteLength('');    // 6 (2 bytes per character)
	 * ```
	 */
	public static byteLength(str: string): number {
		return Bytes._encoder.encode(str).length;
	}

	/**
	 * Type guard to check if a value is a Uint8Array or Buffer.
	 *
	 * @param value - The value to check
	 * @returns true if the value is a Uint8Array (or Buffer in Node.js)
	 *
	 * @example
	 * ```typescript
	 * if (Bytes.isBytes(data)) {
	 *   // data is Uint8Array
	 * }
	 * ```
	 */
	public static isBytes(value: unknown): value is Uint8Array {
		return value instanceof Uint8Array;
	}

}
