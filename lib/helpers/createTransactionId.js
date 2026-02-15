'use strict';

const Crypto = require('crypto');

const createTransactionId = () => Crypto.randomUUID();

module.exports = createTransactionId;
