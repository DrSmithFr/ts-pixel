import {WebEvent} from "../events/event";
import {Logger} from "../../logger";
import {GoPixelContext} from "../go-pixel";

const API_URL = 'https://pixel.local/events';

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
     */
    async sendEvent(events: WebEvent[]): Promise<boolean> {
        if (events.length === 0) {
            return Promise.resolve(false);
        }

        if (this.request !== undefined) {
            this.logger.warn('Sender is busy with another request.');
            return Promise.resolve(false);
        }

        // creating body for the request
        // injecting alteration context to the events
        const serializedEvents = events
            .map((event) => event.object())
            .map((event) => {
                return {
                    ...event,
                    alteration: this.context.alteration,
                };
            });

        // Serializing events to JSON
        const json = JSON.stringify(serializedEvents)

        return new Promise((resolve, reject) => {
            this.request = fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-GoPixel-Id': this.context.visitor,
                    'X-GoPixel-Licence': this.context.vendor,
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