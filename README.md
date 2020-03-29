
[![NPM](https://nodei.co/npm/bencodec.png)](https://npmjs.org/package/bencodec)

[![build](https://circleci.com/gh/IvanSolomakhin/bencodec.svg?style=shield)](https://app.circleci.com/pipelines/github/IvanSolomakhin/bencodec)
[![codecov](https://codecov.io/gh/IvanSolomakhin/bencodec/branch/master/graph/badge.svg)](https://codecov.io/gh/IvanSolomakhin/bencodec)

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
```typescript
  const decoded = bencodec.decode('d3:bar4:spam3:fooi42ee');
  ```

##### Encode data
```typescript
  const encoded = bencodec.encode({ bar: 'spam', foo: 42 });
```
  
## Tests
  ```
  npm test
  ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
