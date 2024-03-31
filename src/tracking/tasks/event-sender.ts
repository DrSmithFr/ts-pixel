import {WebEvent} from "../events/event";
import {Logger} from "../../logger";

const API_URL = 'http://localhost:8080/events';

export class EventSender {
    private logger: Logger = new Logger('EventSender');
    private request: Promise<Response> | undefined;

    public isFree(): boolean {
        return this.request === undefined;
    }

    private releaseLock(): void {
        this.request = undefined;
    }

    async sendEvent(events: WebEvent[]): Promise<boolean> {
        if (events.length === 0) {
            this.logger.debug('No events to send.');
            return Promise.resolve(false);
        }

        if (this.request !== undefined) {
            this.logger.debug('Sender is busy with another request.');
            return Promise.resolve(false);
        }

        return new Promise((resolve, reject) => {
            this.request = fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(events)
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