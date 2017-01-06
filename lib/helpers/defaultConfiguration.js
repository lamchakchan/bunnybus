'use strict';

module.exports = {
    server : {
        ssl                : false,
        user               : 'guest',
        password           : 'guest',
        server             : 'rabbitmq',
        port               : 5672,
        vhost              : '%2f',
        heartbeat          : 2000,
        autoAcknowledgement: false,
        globalExchange     : 'default-exchange',
        prefetch           : 5,
        errorQueue         : 'error-bus',
        silence            : false
    },
    queue : {
        exclusive : false,
        durable   : true,
        autoDelete: false,
        arguments : []
    },
    exchange : {
        durable          : true,
        internal         : false,
        autoDelete       : false,
        alternateExchange: null,
        arguments        : []
    }
};