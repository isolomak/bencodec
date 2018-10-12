'use strict';

/**
 * @description Encode string
 * @param {string} string
 * @returns {string}
 */
const encodeString = (string) => `${string.length}:${string}`;


/**
 * @description Encode number
 * @param {number} number
 * @returns {string}
 */
const encodeNumber = (number) => `i${number}e`;


/**
 * @description Encode list
 * @param {Array} array
 * @returns {string}
 */
const encodeList = (array) => `l${ array.map(item => encode(item)).join('') }e`;


/**
 * @description Encode dictionary
 * @param {Object} object
 * @returns {string}
 */
const encodeDictionary = (object) => 'd' + Object
    .keys(object)
    .map(key => `${key.length}:${key}${encode(object[key])}`)
    .join('') + 'e';


/**
 * @description Encode data
 * @param {string|number|Array|Object} data Data to encode.
 * @returns {Buffer}
 * @example
 * // encode number
 * const encoded = encode(42);
 * @example
 * // encode string
 * const encoded = encode('spam');
 * @example
 * // encode Array
 * const encoded = encode(['spam', 42]);
 * @example
 * // encode Object
 * const encoded = encode({ bar: 'spam', foo: 42 });
 */
const encode = (data) => {
    let result = null;

    if (typeof data === 'string') {
        result = encodeString(data);
    }
    else if (typeof data === 'number') {
        result = encodeNumber(data);
    }
    else if (Array.isArray(data)) {
        result = encodeList(data);
    }
    else {
        result = encodeDictionary(data);
    }
    return Buffer.from(result, 'ascii');
};


const tests = () => {
    console.log('Encode:');
    console.log(' - int_encode_res:', encode(42));
    console.log(' - str_encode_res:', encode('spam'));
    console.log(' - lst_encode_res:', encode(['spam', 42]));
    console.log(' - dct_encode_res:', encode({ bar: 'spam', foo: 42 }));
};

/**
 * Encode data
 * @memberOf module:bencodec
 // * @type {function((string|number|Array|Object)): Buffer}
 */
module.exports = encode;
