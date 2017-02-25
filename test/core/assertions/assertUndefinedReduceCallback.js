'use strict';

const Helpers = require('../../../lib/core/helpers');
const Code = require('code');
const expect = Code.expect;

const assertUndefinedReduceCallback = (...args) => {

    const result = Helpers.reduceCallback(...args);

    expect(result).to.be.undefined();
};

module.exports = assertUndefinedReduceCallback;
