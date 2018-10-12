## bencodec
  Bencode codec. Fast, easy to use, without dependencies.

## Installation
  ```
  npm install bencodec --save
  ```
  
## Usage
  ```js
  const bencodec = require('bencodec');  
    
  // decode example  
  const decoded = bencodec.decode('d3:bar4:spam3:fooi42ee');  
  
  // encode number  
  const encoded = bencodec.encode(42);  
  // encode string  
  const encoded = bencodec.encode('spam');  
  // encode Array  
  const encoded = bencodec.encode(['spam', 42]);  
  // encode Object  
  const encoded = bencodec.encode({ bar: 'spam', foo: 42 });  
  ```
  

## Tests
  ```
  npm test
  ```
