import type { CronJob } from "cron";

export default class Jobs {
    private jobs: Record<string, CronJob> = {};

    add(id: string, job: CronJob) {
        if (this.jobs[id]) {
            console.error(`Job with ID ${id} already added`);
            return;
        }

        this.jobs[id] = job;
    }

    remove(id: string) {
        if (!this.jobs[id]) {
            console.error(`Cannot find job with ID ${id}`);
            return;
        }

        this.jobs[id].stop();
        delete this.jobs[id];
    }

    edit(id: string, job: CronJob) {
        this.remove(id);
        this.add(id, job);
    }
}
