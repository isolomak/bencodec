
[![NPM](https://nodei.co/npm/bencodec.png)](https://npmjs.org/package/bencodec)

![ci](https://github.com/IvanSolomakhin/bencodec/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/IvanSolomakhin/bencodec/badge.svg)](https://coveralls.io/github/IvanSolomakhin/bencodec)
[![NPM Downloads](https://img.shields.io/npm/dt/bencodec)](https://npmjs.org/package/bencodec)
[![NPM License](https://img.shields.io/npm/l/bencodec)](LICENSE.md)

## Bencodec

  Library for decoding and encoding [bencoded](https://en.wikipedia.org/wiki/Bencode) data.  
  Compliant with the [BitTorrent bencoding specification](https://wiki.theory.org/index.php/BitTorrentSpecification#Bencoding).

  Fast and easy to use.  
  Written in TypeScript.  
  Fully tested with 100% code coverage.  
  Without dependencies.  

## Installation

| npm | yarn |
|---|---|
| `npm install --save bencodec` | `yarn add bencodec` |

## Getting Started

### Import library

| typescript | javascript |
|---|---|
| `import bencodec from 'bencodec'` | `const bencodec = require('bencodec')`|

### Decode data

By default, all strings will be parsed as buffers.

``` typescript
  const data = bencodec.decode( 'd3:bar4:spam3:fooi42ee' );
  // or
  const data = bencodec.decode( Buffer.from('d3:bar4:spam3:fooi42ee') );
  
  // data
  { bar: <Buffer 73 70 61 6d>, foo: 42 }
  ```

To convert buffers to strings add `stringify` option.

  ``` typescript
  const data = bencodec.decode( 'd3:bar4:spam3:fooi42ee', { stringify: true } );
  
  // data
  { bar: 'spam', foo: 42 }

  ```

### Encode data

By default method encode will return buffer.

``` typescript
  const data = bencodec.encode({ bar: 'spam', foo: 42 });  
  // <Buffer 64 33 ... 65 65>
  
  const data = bencodec.encode({ bar: 'spam', foo: 42 }, { stringify: true });
  // 'd3:bar4:spam3:fooi42ee'
```

## Tests

``` bash
  npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
