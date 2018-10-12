/**
 * Bencodec
 * @module bencodec
 * @exports bencodec
 * @type {{encode: function, decode: Class}}
 * @example
 * const bencodec = require('bencodec');
 *
 * // decode number
 * const encoded = bencodec.decode('i42e');
 * // decode string
 * const decoded = bencodec.decode('4:spam');
 * // decode Array
 * const decoded = bencodec.decode('l4:spami42ee');
 * // decode Object
 * const decoded = bencodec.decode('d3:bar4:spam3:fooi42ee');
 *
 * // encode number
 * const encoded = bencodec.encode(42);
 * // encode string
 * const encoded = bencodec.encode('spam');
 * // encode Array
 * const encoded = bencodec.encode(['spam', 42]);
 * // encode Object
 * const encoded = bencodec.encode({ bar: 'spam', foo: 42 });
 */
module.exports = {
    /**
     * @description Encode data
     * @method encode
     * @param {string|number|Array|Object} data Data to encode.
     * @returns {Buffer}
     */
    encode: require('./codec/encode'),
    /**
     * @description Decode data
     * @method decode
     * @param {Buffer|string} data Data to decode.
     * @param {boolean|string} [stringify=false] stringify Convert byte array to string?
     * @returns {Buffer|string|number|Array|Object}
     */
    decode: require('./codec/decode')
};
