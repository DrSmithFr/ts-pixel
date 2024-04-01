import {Logger} from "../../logger";

export enum TaskReturnCode {
    Success = 0,
    Skip = 1,
    Failure = 2,
}

/**
 * TaskFn is used to define a function that can be executed by the TaskLimiter
 * It should return a Promise<boolean> to indicate if the task was successful
 */
export type TaskFn = () => Promise<TaskReturnCode>;

/**
 * Task is used to define a task that can be executed by the TaskLimiter
 */
export type Task = {
    name: string,
    fps: number,
    failurePolicy?: TaskFailurePolicy,
    callback: TaskFn,
}

// internal type to wrap the task and store related information
// lastTime is used know when the task needs to be executed
// consecutive errors is used to know if the task is failing
type TaskRegistered = {
    name: string,
    fps: number,
    failurePolicy: TaskFailurePolicy,
    callback: TaskFn,
    lastTime: number
    errors: number
}

/**
 * TaskFailurePolicy is used to define how the TaskLimiter should handle task failures
 * - StopExecution: On error TaskLimiter will stop the execution and throw an error
 * - Retry: On error TaskLimiter will stop the execution and throw an error after MAX_CONSECUTIVE_ERRORS
 * - Continue: On error TaskLimiter will continue the execution
 */
export enum TaskFailurePolicy {
    StopExecution = 'stop',
    Retry = 'retry',
    Continue = 'continue',
}

const MAX_ERRORS = 3;
const DEFAULT_FAILURE_POLICY = TaskFailurePolicy.Retry;

/**
 * TaskLimiter use requestAnimationFrame to regulate the execution of tasks
 *
 * It is used to limit the number of calls to a function by FPS
 * To prevent the browser from being overloaded it only one requestAnimationFrame
 */
export class TaskManager {
    private logger: Logger = new Logger('TaskManager');
    private tasks: TaskRegistered[] = [];

    // reference to cancel the last requestAnimationFrame
    private subscription: number | undefined;

    /**
     * Add a task to the TaskLimiter
     *
     * The task will be executed at the specified FPS
     * Task failure policy can be defined to handle task failures (default: TaskFailurePolicy.Retry)
     *
     * @param task
     */
    public addTask(task: Task) {
        this.tasks.push({
            name: task.name,
            fps: task.fps,
            failurePolicy: task.failurePolicy || DEFAULT_FAILURE_POLICY,
            callback: task.callback,
            lastTime: performance.now(),
            errors: 0,
        });
    }

    /**
     * Start the TaskLimiter
     *
     * The TaskLimiter will start requestAnimationFrame to execute the tasks
     *  - Tasks will be executed when the time elapsed is greater than the frame duration
     *  - Tasks will be executed in the order they were added
     *  - Tasks will be executed until the kill method is called
     *
     */
    public start() {
        this.logger.debug('TaskLimiter started');

        const taskWrapper = () => {
            const now = performance.now();

            for (const task of this.tasks) {
                if (!task.lastTime) {
                    throw new Error('Task lastTime is not defined.');
                }

                const elapsed = now - task.lastTime;
                const frameDuration = 1000 / task.fps;

                // When time elapsed is less than a frame duration, skip the task
                if (elapsed < frameDuration) {
                    continue;
                }

                task
                    .callback()
                    .then((code: TaskReturnCode) => {
                        task.lastTime = now;
                        switch (code) {
                            case TaskReturnCode.Success:
                                // Reset the number of errors
                                task.errors = 0;
                                break;

                            case TaskReturnCode.Skip:
                                break;

                            case TaskReturnCode.Failure:
                            default:
                                task.errors++;
                                this.applyFailurePolicy(task);
                        }

                    })
                    .catch((e: Error) => {
                        task.errors++;
                        this.applyFailurePolicy(task);
                    });
            }

            this.subscription = requestAnimationFrame(taskWrapper);
        };

        this.subscription = requestAnimationFrame(taskWrapper);
    }

    /**
     * Apply the failure policy to the task
     *
     * This policy get applied when the task throw an error or return TaskReturnCode.Failure
     *
     * As task as run in a requestAnimationFrame:
     *  - the task will be retried until the kill method is called
     *  - Soft failure will only be logged
     * @param task
     * @private
     */
    private applyFailurePolicy(task: TaskRegistered) {
        switch (task.failurePolicy) {
            case TaskFailurePolicy.Continue:
                this.logger.error('Task failed, continue...', task);
                return;

            case TaskFailurePolicy.Retry:
                if (task.errors >= MAX_ERRORS) {
                    this.logger.error('Task failed too many times', task);
                    return this.kill();
                }

                this.logger.warn('Task failed, retrying later...', task);
                return;

            case TaskFailurePolicy.StopExecution:
            default:
                this.logger.error('Stopping execution. Task failed');
                return this.kill();
        }
    }

    /**
     * Stop the TaskLimiter
     *
     * This method will cancel the requestAnimationFrame
     */
    public kill() {
        this.logger.info('killed');

        if (this.subscription) {
            cancelAnimationFrame(this.subscription);
        }
    }
}