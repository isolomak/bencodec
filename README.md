# Bencodec

[![NPM](https://nodei.co/npm/bencodec.png)](https://npmjs.org/package/bencodec)

![ci](https://github.com/IvanSolomakhin/bencodec/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/IvanSolomakhin/bencodec/badge.svg)](https://coveralls.io/github/IvanSolomakhin/bencodec)
[![NPM Downloads](https://img.shields.io/npm/dt/bencodec)](https://npmjs.org/package/bencodec)
[![NPM License](https://img.shields.io/npm/l/bencodec)](LICENSE.md)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Library for decoding and encoding [bencode](https://en.wikipedia.org/wiki/Bencode) data  
Compliant with the [BitTorrent bencoding specification](https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding)

Fast and easy to use  
Written in TypeScript  
Fully tested with 100% code coverage  
Without dependencies  

## Installation

``` bash
npm install --save bencodec
```

## Getting Started

### Decode data

By default, all strings will be parsed as buffers

``` typescript
import bencodec from 'bencodec';

const result = bencodec.decode( 'd3:bar4:spam3:fooi42ee' );
// result = { bar: <Buffer 73 70 61 6d>, foo: 42 }
  ```

To convert buffers to strings add `stringify` option

  ``` typescript
  const result = bencodec.decode( 'd3:bar4:spam3:fooi42ee', { stringify: true } );
  // result = { bar: 'spam', foo: 42 }
  ```

### Encode data

By default method encode will return buffer

``` typescript
import bencodec from 'bencodec';

const result = bencodec.encode({ bar: 'spam', foo: 42 });  
// result = <Buffer 64 33 ... 65 65>
```

To convert buffer to string add `stringify` option

``` typescript
const result = bencodec.encode({ bar: 'spam', foo: 42 }, { stringify: true });
// result = 'd3:bar4:spam3:fooi42ee'
```

## Tests

``` bash
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details
