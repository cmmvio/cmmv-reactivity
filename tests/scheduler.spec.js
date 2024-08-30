import { expect } from 'chai';
import { nextTick, queueJob } from '../dist/reactivity.js';

describe('Async Scheduling System', () => {
    it('should execute a job on the next tick', (done) => {
        let called = false;
        nextTick(() => {
            called = true;
            expect(called).to.be.true;
            done();
        });
        expect(called).to.be.false;
    });

    it('should queue jobs and flush them on the next tick', (done) => {
        let job1Executed = false;
        let job2Executed = false;

        queueJob(() => {
            job1Executed = true;
            expect(job1Executed).to.be.true;
            expect(job2Executed).to.be.false; // Ensure job2 runs after job1
        });

        queueJob(() => {
            job2Executed = true;
            expect(job2Executed).to.be.true;
            done();
        });

        expect(job1Executed).to.be.false;
        expect(job2Executed).to.be.false;

        nextTick(() => {
            // This ensures that all jobs have been flushed
            expect(job1Executed).to.be.true;
            expect(job2Executed).to.be.true;
        });
    });

    it('should not queue the same job multiple times', (done) => {
        let callCount = 0;
        const job = () => {
            callCount++;
        };

        queueJob(job);
        queueJob(job);
        queueJob(job);

        nextTick(() => {
            expect(callCount).to.equal(1);
            done();
        });
    });
});
