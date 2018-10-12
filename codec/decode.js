'use strict';

/**
 * Class representing decoder
 * @class
 */
class Decoder {
    /**
     * @constructor
     * @param {Buffer|String} data
     * @param {boolean|string} [stringify=false] stringify
     */
    constructor(data, stringify=false) {
        this.flags = {
            INT: 0x69,
            STR: 0x3A,
            LIST: 0x6C,
            DICT: 0x64,
            END : 0x65
        };
        this.stringify = !!stringify;
        this.data = typeof data === 'string' ? Buffer.from(data) : data;
        this.index = 0;
    }

    /**
     * Convert byte array to string
     * @static
     * @param {Buffer} array
     * @returns {String}
     */
    static byteArrayToString(array) {
        return Buffer.from(array).toString();
    }

    /**
     * Decode integer
     * @param {Buffer} data
     * @returns {number}
     */
    decodeInteger(data) {
        const acc = [];
        while (data[++this.index] !== this.flags.END) {
            acc.push(data[this.index]);
        }
        this.index++;
        return parseInt(Decoder.byteArrayToString(acc));
    }

    /**
     * Decode list
     * @param {Buffer} data
     * @returns {Array}
     */
    decodeList(data) {
        let acc = [];
        this.index++;
        while (data[this.index] !== this.flags.END) {
            acc.push(this.decode());
        }
        this.index++;
        return acc;
    }

    /**
     * Decode dictionary
     * @param {Buffer} data
     * @return {Object}
     */
    decodeDictionary(data) {
        let acc = {};

        this.index++;
        while (data[this.index] !== this.flags.END) {
            let key = this.decodeString(data);
            acc[key] = this.decode(data);
        }
        this.index++;
        return acc;
    }

    /**
     * Decode string
     * If stringify flag provided returns string else byte array
     * @param {Buffer} data
     * @return {String|Buffer}
     */
    decodeString(data) {
        let acc = [];
        let length = [];

        while (data[this.index] !== this.flags.STR) {
            length.push(data[this.index++]);
        }
        length = parseInt(Decoder.byteArrayToString(length));

        this.index++;
        for (let i = 0; i < length; i++) {
            acc.push(data[this.index++]);
        }

        if (this.stringify) {
            return Buffer.from(acc).toString();
        }
        return Buffer.from(acc);
    }

    /**
     * Decode method
     * @param {Buffer|String} [data] data
     * @returns {Buffer|string|number|Array|Object}
     */
    decode(data) {
        data = data || this.data;
        const flag = data[this.index];

        if (flag === this.flags.INT) {
            return this.decodeInteger(data);
        }
        else if (flag === this.flags.LIST) {
            return this.decodeList(data);
        }
        else if (flag === this.flags.DICT) {
            return this.decodeDictionary(data);
        }
        else {
            return this.decodeString(data);
        }
    }
}

const tests = () => {
    const decode = (data) => new Decoder(data).decode();
    console.log('Decode:');
    console.log(' - int_decode_res:', decode('i42e'));
    console.log(' - str_decode_res:', decode('4:spam'));
    console.log(' - lst_decode_res:', decode('l4:spami42ee'));
    console.log(' - dct_decode_res:', decode('d3:bar4:spam3:fooi42ee'));
};
// tests();

module.exports = (data, stringify) => new Decoder(data, stringify).decode();
