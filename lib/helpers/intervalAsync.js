'use strict';

const intervalAsync = async (asyncFunc, interval = 200, timeout = 30000) => {
    await new Promise((resolve, reject) => {
        let settled = false;

        const timeoutRef = setTimeout(() => {
            if (!settled) {
                settled = true;
                clearInterval(intervalRef);
                reject(new Error(`intervalAsync timed out after ${timeout}ms`));
            }
        }, timeout);

        const intervalRef = setInterval(async () => {
            if (settled) {
                return;
            }

            try {
                if (await asyncFunc()) {
                    settled = true;
                    clearInterval(intervalRef);
                    clearTimeout(timeoutRef);
                    resolve();
                }
            } catch (err) {
                settled = true;
                clearInterval(intervalRef);
                clearTimeout(timeoutRef);
                reject(err);
            }
        }, interval);
    });
};

module.exports = intervalAsync;
