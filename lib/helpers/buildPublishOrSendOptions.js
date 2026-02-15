'use strict';

const SEND_OR_PUBLISH_OPTION_KEYS = new Set([
    'expiration',
    'userId',
    'CC',
    'priority',
    'persistent',
    'deliveryMode',
    'mandatory',
    'BCC',
    'contentType',
    'contentEncoding',
    'correlationId',
    'replyTo',
    'messageId',
    'timestamp',
    'type',
    'appId'
]);

const buildPublishOrSendOptions = (options, headers) => {
    const result = {
        headers
    };

    if (options !== null && typeof options === 'object') {
        const keys = Object.keys(options);

        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];

            if (SEND_OR_PUBLISH_OPTION_KEYS.has(key) && options[key] !== null) {
                result[key] = options[key];
            }
        }
    }

    return result;
};

module.exports = buildPublishOrSendOptions;
