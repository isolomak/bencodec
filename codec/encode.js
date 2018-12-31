'use strict';

/**
 * Class representing encoder
 * @class
 */
class Encoder {
    /**
     * @constructor
     * @param {Buffer|String|Array|Object|Number|Boolean} data
     */
    constructor(data) {
        if (!data) {
            this.result = null;
            return ;
        }
        this.buffers = [];
        this._encode(data);
        this.result = Buffer.concat(this.buffers);
    }


    /**
     * @description Encode data
     * @param {Buffer|String|Array|Object|Number|Boolean} data Data to encode.
     * @returns {Buffer}
     * @methodOf module:bencodec
     * @example
     */
    _encode(data) {
        if (!data) {
            return ;
        }

        if (Buffer.isBuffer(data)) {
            this._encodeBuffer(data);
        }
        else if (Array.isArray(data)) {
            this._encodeArray(data);
        }
        else if (typeof data === 'string') {
            this._encodeString(data);
        }
        else if (typeof data === 'number') {
            this._encodeNumber(data);
        }
        else if (typeof data === 'boolean') {
            this._encodeBoolean(data);
        }
        else {
            this._encodeObject(data);
        }
    }


    /**
     * @description Encode buffer
     * @param {Buffer} data
     */
    _encodeBuffer(data) {
        this.buffers.push(Buffer.from(data.length + ':'), data);
    }


    /**
     * @description Encode array
     * @param {Array} data
     */
    _encodeArray(data) {
        this.buffers.push(Buffer.from('l'));
        for (let i = 0; i < data.length; i++) {
            this._encode(data[i]);
        }
        this.buffers.push(Buffer.from('e'));
    }


    /**
     * @description Encode string
     * @param {String} data
     */
    _encodeString(data) {
        this.buffers.push(Buffer.from(Buffer.byteLength(data) + ':' + data));
    }


    /**
     * @description Encode number
     * @param {Number} data
     */
    _encodeNumber(data) {
        if (Number(data) === data && data % 1 !== 0) {
            console.warn(`Warning: float detected, float [ ${data} ] was converted to integer [ ${parseInt(data)} ]`);
            data = parseInt(data);
        }

        this.buffers.push(Buffer.from('i' + data + 'e'));
    }


    /**
     * @description Encode boolean
     * @param {Boolean} data
     */
    _encodeBoolean(data) {
        if (data === true) {
            this._encodeNumber(1);
        }
        else {
            this._encodeNumber(0);
        }
    }


    /**
     * @description Encode object
     * @param {Object} data
     */
    _encodeObject(data) {
        const keys = Object.keys(data).sort();
        this.buffers.push(Buffer.from('d'));

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            this._encodeString(key);
            this._encode(data[key]);
        }

        this.buffers.push(Buffer.from('e'));
    }
}

module.exports = (data) => new Encoder(data).result;
