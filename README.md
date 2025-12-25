# bencodec

![CI](https://github.com/isolomak/bencodec/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/isolomak/bencodec/badge.svg)](https://coveralls.io/github/isolomak/bencodec)
[![npm version](https://img.shields.io/npm/v/bencodec.svg)](https://www.npmjs.com/package/bencodec)
[![npm downloads](https://img.shields.io/npm/dm/bencodec.svg)](https://www.npmjs.com/package/bencodec)
[![License: MIT](https://img.shields.io/npm/l/bencodec)](LICENSE.md)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

**A fast, secure, zero-dependency bencode encoder/decoder for modern JavaScript runtimes.**

Universal TypeScript library compliant with the [BitTorrent bencoding specification](https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding). Works in Node.js, browsers, Deno, and Bun.

## Highlights

- **Zero Dependencies** - No external packages, minimal attack surface
- **Universal** - Works in Node.js, browsers, Deno, and Bun
- **TypeScript First** - Full type definitions with generics support
- **Security Built-in** - DoS protection with configurable limits
- **BitTorrent Compliant** - Strict mode for spec validation
- **Modern API** - Uses `Uint8Array` (not Node.js Buffer)
- **Dual Package** - ESM and CommonJS exports
- **100% Tested** - Complete code coverage

## Installation

```bash
# npm
npm install bencodec

# yarn
yarn add bencodec

# pnpm
pnpm add bencodec

# bun
bun add bencodec
```

## Quick Start

```typescript
import { encodeToBytes, encodeToString, decode } from 'bencodec';

// Encode JavaScript values to bencode (Uint8Array)
const bytes = encodeToBytes({ announce: 'http://tracker.example.com', info: { name: 'file.txt' } });

// Encode JavaScript values to bencode (string)
const str = encodeToString({ announce: 'http://tracker.example.com', info: { name: 'file.txt' } });

// Decode bencode data
const decoded = decode(bytes, { stringify: true });
// { announce: 'http://tracker.example.com', info: { name: 'file.txt' } }
```

## Usage

### Decoding

```typescript
import { decode } from 'bencodec';

// Decode integers
decode('i42e');  // 42

// Decode strings (returns Uint8Array by default)
decode('5:hello');  // Uint8Array [0x68, 0x65, 0x6c, 0x6c, 0x6f]

// Decode strings as JavaScript strings
decode('5:hello', { stringify: true });  // 'hello'

// Decode lists
decode('li1ei2ei3ee', { stringify: true });  // [1, 2, 3]

// Decode dictionaries
decode('d3:fooi42e3:bar4:spame', { stringify: true });  // { bar: 'spam', foo: 42 }

// Type the result with generics
interface Torrent {
  announce: string;
  info: { name: string };
}
const torrent = decode<Torrent>(buffer, { stringify: true });
```

### Encoding

#### Encode to Bytes (Uint8Array)

```typescript
import { encodeToBytes } from 'bencodec';

// Encode integers
encodeToBytes(42);  // Uint8Array for 'i42e'

// Encode strings
encodeToBytes('hello');  // Uint8Array for '5:hello'

// Encode lists
encodeToBytes([1, 2, 3]);  // Uint8Array for 'li1ei2ei3ee'

// Encode dictionaries (keys auto-sorted per spec)
encodeToBytes({ z: 1, a: 2 });  // Uint8Array for 'd1:ai2e1:zi1ee'

// Encode binary data
encodeToBytes(new Uint8Array([0x00, 0xff]));
```

#### Encode to String

```typescript
import { encodeToString } from 'bencodec';

// Encode to string (UTF-8 by default)
encodeToString({ foo: 'bar' });  // 'd3:foo3:bare'

// Encode integers
encodeToString(42);  // 'i42e'

// Use latin1 encoding for binary data preservation
encodeToString(new Uint8Array([0x00, 0xff]), { encoding: 'latin1' });  // '2:\x00\xff'

// Supported encodings: 'utf8', 'utf-8', 'latin1', 'binary', 'ascii'
encodeToString({ foo: 42 }, { encoding: 'utf8' });
```

#### Legacy encode() (Deprecated)

```typescript
import { encode } from 'bencodec';

// Deprecated - use encodeToBytes or encodeToString instead
encode(42);                        // Returns Uint8Array
encode({ foo: 'bar' }, { stringify: true });  // Returns string
```

### Default Export

```typescript
import bencodec from 'bencodec';

bencodec.encodeToBytes({ foo: 42 });
bencodec.encodeToString({ foo: 42 });
bencodec.decode('d3:fooi42ee');
```

### Options

#### Decode Options (IBencodecOptions)

```typescript
interface IBencodecOptions {
  /** Return strings instead of Uint8Array (default: false) */
  stringify?: boolean;

  /** Enable strict BitTorrent spec validation (default: false) */
  strict?: boolean;

  /** Character encoding: 'utf8' | 'latin1' | 'ascii' | 'binary' (default: 'utf8') */
  encoding?: ByteEncoding;

  /** Maximum string length in bytes - security limit */
  maxStringLength?: number;

  /** Maximum nesting depth - security limit */
  maxDepth?: number;
}
```

#### Encode to String Options (IBencodeEncodeOptions)

```typescript
interface IBencodeEncodeOptions {
  /** Character encoding for output (default: 'utf8') */
  encoding?: 'utf8' | 'utf-8' | 'latin1' | 'binary' | 'ascii';
}
```

## Strict Mode

Enable strict mode for BitTorrent specification compliance:

```typescript
// Enforces sorted dictionary keys
decode('d1:bi1e1:ai2ee', { strict: true });
// Throws: UNSORTED_KEYS

// Rejects trailing data
decode('i42eextra', { strict: true });
// Throws: TRAILING_DATA
```

## Security

Bencodec includes built-in protections against denial-of-service attacks when parsing untrusted data.

### Memory Exhaustion Protection

Prevent memory exhaustion from maliciously large strings:

```typescript
decode(untrustedData, {
  maxStringLength: 10 * 1024 * 1024  // 10 MB limit
});
```

### Stack Overflow Protection

Prevent stack overflow from deeply nested structures:

```typescript
decode(untrustedData, {
  maxDepth: 100  // Maximum nesting depth
});
```

### Recommended Settings for Untrusted Data

```typescript
const SAFE_OPTIONS = {
  maxStringLength: 10 * 1024 * 1024,  // 10 MB
  maxDepth: 100,
  strict: true
};

decode(untrustedData, SAFE_OPTIONS);
```

## Error Handling

Bencodec provides structured error classes with specific error codes for programmatic handling.

### Error Classes

```typescript
import {
  BencodeError,        // Base class
  BencodeDecodeError,  // Decode errors (includes position)
  BencodeEncodeError,  // Encode errors (includes path)
  BencodeErrorCode
} from 'bencodec';
```

### Error Codes

| Code | Description |
|------|-------------|
| `EMPTY_INPUT` | Input data is empty or falsy |
| `UNEXPECTED_END` | Data ends unexpectedly |
| `INVALID_FORMAT` | Invalid bencode format |
| `LEADING_ZEROS` | Integer has leading zeros (e.g., `i03e`) |
| `NEGATIVE_ZERO` | Negative zero (`i-0e`) is not allowed |
| `UNSORTED_KEYS` | Dictionary keys not sorted (strict mode) |
| `TRAILING_DATA` | Extra data after valid bencode (strict mode) |
| `MAX_DEPTH_EXCEEDED` | Nesting depth exceeds limit |
| `MAX_SIZE_EXCEEDED` | String length exceeds limit |
| `UNSUPPORTED_TYPE` | Attempted to encode unsupported type |
| `CIRCULAR_REFERENCE` | Circular reference detected |

### Decode Error Example

```typescript
import { decode, BencodeDecodeError, BencodeErrorCode } from 'bencodec';

try {
  decode(untrustedData, { strict: true, maxDepth: 50 });
} catch (error) {
  if (error instanceof BencodeDecodeError) {
    switch (error.code) {
      case BencodeErrorCode.MAX_DEPTH_EXCEEDED:
        console.error(`Too deeply nested at position ${error.position}`);
        break;
      case BencodeErrorCode.INVALID_FORMAT:
        console.error(`Malformed data at position ${error.position}`);
        break;
    }
  }
}
```

### Encode Error Example

```typescript
import { encode, BencodeEncodeError } from 'bencodec';

try {
  const circular: any = { a: 1 };
  circular.self = circular;
  encode(circular);
} catch (error) {
  if (error instanceof BencodeEncodeError) {
    console.error(`Error at path: ${error.path?.join('.')}`);
    // Output: Error at path: self
  }
}
```

## Platform Support

| Platform | Version | Notes |
|----------|---------|-------|
| Node.js | 18+ | Full support |
| Browsers | Modern | Chrome, Firefox, Safari, Edge |
| Deno | 1.0+ | Full support |
| Bun | 1.0+ | Full support |

### Browser Usage

```html
<script type="module">
  import { encode, decode } from 'https://esm.sh/bencodec';

  const encoded = encode({ hello: 'world' });
  console.log(decode(encoded, { stringify: true }));
</script>
```

### Deno Usage

```typescript
import { encode, decode } from 'npm:bencodec';

const encoded = encode({ hello: 'world' });
console.log(decode(encoded, { stringify: true }));
```

## Type Definitions

Full TypeScript support with exported types:

```typescript
import type {
  IBencodecOptions,
  IBencodeEncodeOptions,
  BencodeDecodedValue,
  BencodeEncodableValue,
  ByteEncoding
} from 'bencodec';
```

## Non-Standard Behaviors

For maximum compatibility, bencodec handles some edge cases beyond the strict spec:

| Behavior | Description |
|----------|-------------|
| Plus sign in integers | Leading `+` is silently ignored (`i+42e` -> `42`) |
| Float truncation | Decimal numbers truncated toward zero |
| Boolean encoding | Booleans encoded as integers (`true` -> `i1e`) |
| Null/undefined | Silently skipped in lists and dictionaries |

## License

[MIT](LICENSE.md)
