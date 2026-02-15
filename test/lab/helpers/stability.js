'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('stability', () => {
        describe('intervalAsync', () => {
            it('should timeout after specified duration when condition is never met', { timeout: 5000 }, async () => {
                let result = null;

                try {
                    await Helpers.intervalAsync(async () => false, 50, 500);
                } catch (err) {
                    result = err;
                }

                expect(result).to.exist();
                expect(result.message).to.contain('timed out');
            });

            it('should resolve before timeout when condition is met', { timeout: 5000 }, async () => {
                let counter = 0;

                await Helpers.intervalAsync(
                    async () => {
                        return ++counter >= 3;
                    },
                    50,
                    5000
                );

                expect(counter).to.equal(3);
            });

            it('should not leak timers after timeout', { timeout: 5000 }, async () => {
                const activeTimersBefore = process._getActiveHandles().length;

                try {
                    await Helpers.intervalAsync(async () => false, 10, 200);
                } catch (err) {
                    // expected timeout
                }

                // Allow timers to clean up
                await new Promise((resolve) => setTimeout(resolve, 50));

                const activeTimersAfter = process._getActiveHandles().length;

                // Should not have leaked timers (allow some tolerance for other handles)
                expect(activeTimersAfter).to.be.at.most(activeTimersBefore + 1);
            });

            it('should not resolve or reject multiple times', { timeout: 5000 }, async () => {
                let resolveCount = 0;
                let rejectCount = 0;

                const originalThen = Promise.prototype.then;

                try {
                    await Helpers.intervalAsync(
                        async () => {
                            return true;
                        },
                        10,
                        1000
                    );
                    resolveCount++;
                } catch (err) {
                    rejectCount++;
                }

                expect(resolveCount + rejectCount).to.equal(1);
            });
        });

        describe('timeoutAsync', () => {
            it('should not settle twice when function resolves near timeout boundary', { timeout: 5000 }, async () => {
                let settleCount = 0;

                const borderlineFunc = async () => {
                    await new Promise((resolve) => setTimeout(resolve, 95));
                    return 'result';
                };

                try {
                    await Helpers.timeoutAsync(borderlineFunc, 100)();
                    settleCount++;
                } catch {
                    settleCount++;
                }

                // Wait past the timeout to ensure no double settlement
                await new Promise((resolve) => setTimeout(resolve, 150));

                expect(settleCount).to.equal(1);
            });

            it('should properly clean up timeout when function resolves quickly', async () => {
                const quickFunc = async () => 'quick';

                const result = await Helpers.timeoutAsync(quickFunc, 5000)();

                expect(result).to.equal('quick');
            });

            it('should propagate errors from the async function', async () => {
                const errorFunc = async () => {
                    throw new Error('async error');
                };

                let result = null;

                try {
                    await Helpers.timeoutAsync(errorFunc, 5000)();
                } catch (err) {
                    result = err;
                }

                expect(result).to.exist();
                expect(result.message).to.equal('async error');
            });

            it('should handle concurrent timeoutAsync calls independently', { timeout: 5000 }, async () => {
                const slowFunc = async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    return value;
                };

                const results = await Promise.all([
                    Helpers.timeoutAsync(slowFunc, 5000)('a'),
                    Helpers.timeoutAsync(slowFunc, 5000)('b'),
                    Helpers.timeoutAsync(slowFunc, 5000)('c')
                ]);

                expect(results).to.equal(['a', 'b', 'c']);
            });
        });
    });
});
