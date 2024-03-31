import {WebEvent} from "../events/event";
import {Logger} from "../../logger";
import {GoPixelContext} from "../go-pixel";

const API_URL = 'http://localhost:8080/events';

/**
 * This class is responsible for sending events to the server
 *  - EventSender instance can only send one request at a time
 *  - EventSender instance can only send events in batches (batch size as no limit)
 */
export class EventSender {
    private logger: Logger = new Logger('EventSender');

    // reference to the pending request (internally used as lock)
    private request: Promise<Response> | undefined;

    // reference to the context
    private readonly context: GoPixelContext;

    constructor(context: GoPixelContext) {
        this.context = context;
    }

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
     * @param events {WebEvent[]}
     * @param ctx {GoPixelContext}
     */
    async sendEvent(events: WebEvent[]): Promise<boolean> {
        if (events.length === 0) {
            this.logger.debug('No events to send.');
            return Promise.resolve(false);
        }

        if (this.request !== undefined) {
            this.logger.debug('Sender is busy with another request.');
            return Promise.resolve(false);
        }

        const serializedEvents = events.map((event) => event.object(this.context));
        const json = JSON.stringify(serializedEvents)

        return new Promise((resolve, reject) => {
            this.request = fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: json,
            });

            this
                .request
                .then((response) => {
                    this.releaseLock();

                    if (response.ok) {
                        resolve(true);
                    } else {
                        reject('Failed to save events: ' + response.statusText);
                    }
                })
                .catch((error) => {
                    this.releaseLock();
                    reject('Failed to send events: ' + error);
                });
        });
    }
}