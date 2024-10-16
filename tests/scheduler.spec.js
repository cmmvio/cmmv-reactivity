import { describe, it, expect } from 'vitest';
import { nextTick, queueJob } from '../dist/reactivity.js';

describe('Async Scheduling System', () => {
    it('should execute a job on the next tick', async () => {
        let called = false;
        nextTick(() => {
            called = true;
            expect(called).toBe(true);
        });
        expect(called).toBe(false);

        await nextTick(); // aguardar a próxima tick para garantir que o teste seja concluído
    });

    it('should queue jobs and flush them on the next tick', async () => {
        let job1Executed = false;
        let job2Executed = false;

        queueJob(() => {
            job1Executed = true;
            expect(job1Executed).toBe(true);
            expect(job2Executed).toBe(false); // Garantir que o job2 rode após o job1
        });

        queueJob(() => {
            job2Executed = true;
            expect(job2Executed).toBe(true);
        });

        expect(job1Executed).toBe(false);
        expect(job2Executed).toBe(false);

        await nextTick(); // aguardar o próximo tick

        // Aqui garante que todos os jobs foram processados
        expect(job1Executed).toBe(true);
        expect(job2Executed).toBe(true);
    });

    it('should not queue the same job multiple times', async () => {
        let callCount = 0;
        const job = () => {
            callCount++;
        };

        queueJob(job);
        queueJob(job);
        queueJob(job);

        await nextTick(); // aguardar o próximo tick
        expect(callCount).toBe(1);
    });
});
