'use strict';

const timeoutAsync = (asyncFunc, timeout = 100) => {
    return async (...args) => {
        return new Promise((resolve, reject) => {
            let settled = false;

            const timeoutRef = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    reject(new Error('Timeout occurred'));
                }
            }, timeout);

            asyncFunc(...args).then(
                (result) => {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timeoutRef);
                        resolve(result);
                    }
                },
                (err) => {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timeoutRef);
                        reject(err);
                    }
                }
            );
        });
    };
};

module.exports = timeoutAsync;
