import {Logger} from "../logger";
import {WebEvent, WebEventFactory} from "./events/event";
import {DeviceInfoFactory} from "./events/device-info";

export type Uuid = string;

export type GoPixelContext = {
    client: Uuid,
    visitor: Uuid,

    page: Uuid | undefined,
    variant: Uuid | undefined,
}

export type GoPixelConfig = {
    licence: string,
    domain: string,
}

const MAX_BUFFER_SIZE = 1000;


enum EventName {
    PageLoad = 'page_load',
    DeviceInfo = 'device_info',
}

export class GoPixel {
    /**
     * Global configuration for the library
     */
    public config: GoPixelConfig;

    private factories: Map<string, WebEventFactory> = new Map<string, WebEventFactory>();

    /**
     * Buffer to store tracking events until they are sent
     *
     * The buffer is limited to a certain size to prevent memory leaks
     * The buffer is emptied when consumed
     * The buffer can only be consumed after the library has started
     *
     * @type {WebEvent[]}
     * @private
     */
    private buffer: WebEvent[] = [];

    /**
     * Flag to check if the library should start sending events
     * @private
     */
    private isStarted: boolean = false;

    constructor(cfg: GoPixelConfig) {
        this.config = cfg;

        // register all event factories
        this.registerFactory(EventName.DeviceInfo, new DeviceInfoFactory());
        this.registerFactory(EventName.PageLoad, new DeviceInfoFactory());

        // Sending basic events
        this.pushEvent(EventName.DeviceInfo);
        this.pushEvent(EventName.PageLoad);
    }

    /**
     * Register a new event factory
     *
     * This method can be called before the library start
     * This method can be called multiple times
     *
     * If an event with the same name is already registered, it will be overwritten
     */
    private registerFactory(name: EventName, factory: WebEventFactory): void {
        this.factories.set(name, factory);
        Logger.debug('Registered event', name);
    }

    private getFactory(name: EventName): WebEventFactory | undefined {
        return this.factories.get(name);
    }

    private pushEvent(name: EventName): void {
        const factory = this.getFactory(name);

        if (!factory) {
            throw new Error('Factory not found for event type ' + name);
        }

        const e = factory.create();

        if (e instanceof Promise) {
            e.then((event) => this.buffer.push(event));
        } else {
            this.buffer.push(e);
        }
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
    public push(event: WebEvent) {
        if (this.buffer.length >= MAX_BUFFER_SIZE) {
            Logger.debug('Buffer is full. Dropping event', event);
            return;
        }

        this.buffer.push(event);
    }

    /**
     * Start allowing buffer consumption
     */
    public start() {
        this.isStarted = true;
        Logger.log('Start sending events, awaiting events in buffer:', this.buffer.length);
    }

    /**
     * Stop allowing buffer consumption
     * Stop all subscriptions and event listeners
     * Clear the current buffer
     * (Allow to stop tracking user activity when the user has not given consent)
     */
    public kill(): void {
        this.isStarted = false;
        this.buffer = [];
        Logger.log('Killed subscription and cleared buffer.');
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
            Logger.debug('Cannot consume events before the library has started');
            return [];
        }

        const events = this.buffer;
        this.buffer = [];

        return events;
    }
}