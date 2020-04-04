
[![NPM](https://nodei.co/npm/bencodec.png)](https://npmjs.org/package/bencodec)

![ci](https://github.com/IvanSolomakhin/bencodec/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/IvanSolomakhin/bencodec/badge.svg)](https://coveralls.io/github/IvanSolomakhin/magnetizer)
[![NPM Downloads](https://img.shields.io/npm/dt/bencodec)](https://npmjs.org/package/magnetizer)
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

##### Import library
| typescript | javascript |
|---|---|
| ` import bencodec from 'bencodec' ` | ` const bencodec = require('bencodec') `|

##### Decode data
To convert byte strings to strings pass `true` as the second parameter.
```
  bencodec.decode( 'd3:bar4:spam3:fooi42ee' );
  // { bar: <Buffer 73 70 61 6d>, foo: 42 }
  
  bencodec.decode( 'd3:bar4:spam3:fooi42ee', true );
  // { bar: 'spam', foo: 42 }
  
  bencodec.decode( Buffer.from('d3:bar4:spam3:fooi42ee'), true );
  // { bar: 'spam', foo: 42 }
  ```

##### Encode data
By default method encode will return the byte string.  
Pass `true` as the second parameter to 'stringify' result.
```
  bencodec.encode({ bar: 'spam', foo: 42 });  
  // <Buffer 64 33 ... 65 65>
  
  bencodec.encode({ bar: 'spam', foo: 42 }, true);
  // 'd3:bar4:spam3:fooi42ee'
```

## Tests
  ```
  npm test
  ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
