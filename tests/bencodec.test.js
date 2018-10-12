const assert = require('assert');
const bencodec = require('../bencodec');

const equal = (actual, expected) => {
    const buffer = Buffer.from(actual);
    const result = bencodec.encode(expected);

    return buffer.equals(result);
};

describe('#encode', () => {
    it('should encode string', function () {
        assert.ok( equal('4:spam', 'spam') );
    });
    it('should encode number', function () {
        assert.ok( equal('i42e', 42) );
    });
    it('should encode array', function () {
        assert.ok( equal('l4:spami42ee', ['spam', 42]) );
    });
    it('should encode object', function () {
        assert.ok( equal('d3:bar4:spam3:fooi42ee', { bar: 'spam', foo: 42 }) );
    });
});

describe('#decode', () => {
    it('should decode string without stringify option', function () {
        assert.ok(Buffer.from('spam').equals(bencodec.decode('4:spam')));
    });
    it('should decode string with stringify option', function () {
        assert.strictEqual('spam', bencodec.decode('4:spam', true));
    });
    it('should decode number', function () {
        assert.strictEqual(42, bencodec.decode('i42e'));
    });
    it('should decode array', function () {
        assert.deepStrictEqual(['spam', 42], bencodec.decode('l4:spami42ee', true));
    });
    it('should decode object', function () {
        assert.deepStrictEqual({ bar: 'spam', foo: 42 }, bencodec.decode('d3:bar4:spam3:fooi42ee', true));
    });
});
