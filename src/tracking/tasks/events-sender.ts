import {Logger} from "../../utils/logger";
import {WebEvent} from "../events/event";
import {Task, TaskFailurePolicy, TaskReturnCode} from "./task-manager";
import {finalize, from, map, Observable, of} from "rxjs";
import {TrackingContext} from "../tracker";

const API_URL = 'https://pixel.local/events';


export class EventSender {
    /**
     * Flag to check if the library should start sending events
     * @private
     */
    private isStarted: boolean = false;

    /**
     * Flag to check if the library should stop sending events
     * @private
     */
    private killSwitch: boolean = false;

    /**
     * Maximum size of the buffer
     * If the buffer is full, the events will be dropped
     */
    static MAX_BUFFER_SIZE = 1000;

    /**
     * Buffer to store tracking events until they are sent
     *
     * The buffer is limited to a certain size to prevent memory leaks
     * The buffer is emptied when consumed
     * The buffer can only be consumed after the library has started
     */
    public buffer: WebEvent[];

    /**
     * Event sender to send events to the server
     *
     * The sender is responsible for sending events to the server
     * The sender is limited to send one request at a time
     * The sender is limited to send events in batches (batch size as no limit)
     */
    public sender: EventClient;

    // Logger to log messages to the console
    private logger: Logger = new Logger('EventQueue');

    constructor(
        private ctx: TrackingContext
    ) {
        this.buffer = [];
        this.sender = new EventClient();
    }


    /**
     * Send event in the buffer
     *
     * This method can be called before the library start
     * This method can be called multiple times
     *
     * When the buffer is full, the event keep being dropped
     * (Allow to track user activity before receiving consent to send data to the server)
     */
    public push(event: WebEvent): boolean {
        if (this.buffer.length >= EventSender.MAX_BUFFER_SIZE) {
            this.logger.debug('Buffer is full. Dropping event', event);
            return false;
        }

        this.buffer.push(event);
        return true;
    }

    /**
     * Start allowing buffer consumption
     */
    public start() {
        this.isStarted = true;
    }

    /**
     * Stop allowing buffer consumption
     * Stop all subscriptions and event listeners
     * Clear the current buffer
     * (Allow to stop tracking user activity when the user has not given consent)
     */
    public kill(): void {
        this.killSwitch = true;
        this.isStarted = false;

        this.buffer = [];
        this.logger.log('Cleared events buffer.');
    }

    /**
     * This task sends events to the server by batches
     * The task is limited by 10 FPS, to prevent the browser from being overloaded
     *
     * The task will skip if there are no events to send
     * The task will retry on failure
     */
    public makeTask(): Task {
        return {
            name: 'eventSender',
            fps: 10,
            failurePolicy: TaskFailurePolicy.Retry,
            callback: this.sendEvents.bind(this)
        }
    }

    /**
     * Send events to the server
     *
     * This method will send all events in the buffer to the server
     * This method will return a TaskReturnCode to indicate the status of the task
     *
     * If the buffer is empty, the task will skip
     * If the sender is busy, the task will skip
     * If the sender fails to send events, the task will fail
     *
     * Do nothing if killSwitch is enabled!
     *
     * @private
     */
    public sendEvents(): Observable<TaskReturnCode> {
        if (!this.isStarted) {
            return of(TaskReturnCode.Failure);
        }

        if (this.killSwitch) {
            return of(TaskReturnCode.Skip);
        }

        if (this.buffer.length === 0) {
            return of(TaskReturnCode.Skip);
        }

        if (!this.sender.isFree()) {
            return of(TaskReturnCode.Skip);
        }

        return new Observable<TaskReturnCode>((obs) => {
            // After this point, events can be definitely lost
            const events = this.consume();

            this
                .sender
                .sendEvent(events, this.ctx)
                .subscribe(
                    {
                        next: () => {
                            obs.next(TaskReturnCode.Success);
                            obs.complete();
                        },
                        error: (error) => {
                            this.logger.error('Failed to send events, adding events back to the buffer', error);
                            this.buffer.unshift(...events);

                            obs.error(error);
                        }
                    }
                )
        });
    }

    /**
     * Consume all events in the buffer
     *
     * this method swap the buffer with an empty array and return the previous buffer
     * This operation is atomic
     *
     * If called before the library has started, it will return an empty array
     * @private
     */
    private consume(): WebEvent[] {
        if (!this.isStarted) {
            this.logger.debug('Cannot consume events before the library has started');
            return [];
        }

        const events = this.buffer;
        this.buffer = [];

        return events;
    }
}

/**
 * This class is responsible for sending events to the server
 *  - EventSender instance can only send one request at a time
 *  - EventSender instance can only send events in batches (batch size as no limit)
 */
export class EventClient {
    private logger: Logger = new Logger('EventApiClient');

    // reference to the pending request (internally used as lock)
    private request: Observable<boolean> | undefined;

    /**
     * Check if the sender is free to send events
     */
    public isFree(): boolean {
        return this.request === undefined;
    }

    /**
     * Remove the request lock
     * (!can destroy unfinished requests, but it's ok for this use case)
     * @private
     */
    private releaseLock(): void {
        this.request = undefined;
    }

    /**
     * Send events to the server
     */
    sendEvent(events: WebEvent[], context: TrackingContext): Observable<boolean> {
        if (events.length === 0) {
            return of(false);
        }

        if (this.request !== undefined) {
            this.logger.warn('Sender is busy with another request.');
            return of(false);
        }

        // creating body for the request
        // injecting alteration context to the events
        const serializedEvents = events
            .map((event) => event.object())
            .map((event) => {
                return {
                    ...event,
                    alteration: context.alteration,
                };
            });

        // Serializing events to JSON
        const json = JSON.stringify(serializedEvents)

        this.request = from(
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-GoPixel-Id': context.visitor,
                    'X-GoPixel-Licence': context.client,
                },
                body: json,
            })
        ).pipe(
            // handling response
            map((response) => {
                if (response.ok) {
                    this.logger.debug('Events sent successfully.');
                    return true;
                }

                this.logger.error('Failed to send events:', response);
                throw new Error('Failed to send events.' + response.statusText);
            }),
            // releasing the lock
            finalize(() => this.releaseLock())
        );

        return this.request;
    }
}