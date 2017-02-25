'use strict';

const Helpers = require('../../../lib/core/helpers');
const Code = require('code');
const expect = Code.expect;

const assertConvertToBuffer = (data, callback) => {

    Helpers.convertToBuffer(data, (err, result) => {

        expect(err).to.be.null();
        expect(result.buffer).to.be.a.instanceof(Buffer);

        if (Buffer.isBuffer(data)) {
            expect(Buffer.compare(result.buffer, data)).to.be.equal(0);
            expect(result.isBuffer).to.be.true();
        }
        else {
            expect(JSON.parse(result.buffer.toString())).to.be.equal(data);
            expect(result.isBuffer).to.be.false();
        }

        callback();
    });
};

module.exports = assertConvertToBuffer;
