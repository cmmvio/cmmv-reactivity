let isFlushing = false;
const queue: Function[] = [];
const p = Promise.resolve();

export const nextTick = (fn: () => void) => p.then(fn);

export const queueJob = (job: Function) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }

    if (!isFlushing) {
        isFlushing = true;
        nextTick(flushJobs);
    }
}

const flushJobs = () => {
    let job;

    while ((job = queue.shift())) {
        job();
    }
    
    isFlushing = false;
}
