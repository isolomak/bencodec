## bencodec
  Bencode codec. Fast, easy to use, without dependencies.

## Installation
  npm install bencodec --save
  
## Usage

  const bencodec = require('bencodec');  
  
  // decode number  
  const encoded = bencodec.decode('i42e');  
  // decode string  
  const decoded = bencodec.decode('4:spam');  
  // decode Array  
  const decoded = bencodec.decode('l4:spami42ee');  
  // decode Object  
  const decoded = bencodec.decode('d3:bar4:spam3:fooi42ee');  
  
  // encode number  
  const encoded = bencodec.encode(42);  
  // encode string  
  const encoded = bencodec.encode('spam');  
  // encode Array  
  const encoded = bencodec.encode(['spam', 42]);  
  // encode Object  
  const encoded = bencodec.encode({ bar: 'spam', foo: 42 });  
  
  

## Tests

  npm test
