import {Logger} from "../logger";
import {WebEvent, WebEventFactory} from "./events/event";
import {DeviceInfoFactory} from "./events/device-info";
import {TaskManager} from "./tasks/task-manager";
import {EventSender} from "./tasks/event-sender";
import {sendEventTask} from "./tasks/task-send-event";
import {PageLoadFactory} from "./events/page-load";
import {v4 as uuidv4} from 'uuid';
import {payloadFromMouseEvent} from "./events/payload";

export type Uuid = string;

export type GoPixelContext = {
    vendor: Uuid,
    visitor: Uuid,
    alteration?: AlterationContext
}

export type AlterationContext = {
    page: Uuid,
    alter: Uuid,
}

export type GoPixelConfig = {
    licence: string,
    domain: string,
}


enum EventName {
    PageLoad = 'page_load',
    DeviceInfo = 'device_info',
    MouseInfo = 'mouse_info',
}

type ListenerFn = (event: any) => void;
type ListenerRefList = Map<string, ListenerFn>;

export class GoPixel {
    /**
     * Global configuration for the library
     */
    public config: GoPixelConfig;

    /**
     * Context of the current visitor
     */
    public context: GoPixelContext | undefined = undefined;

    /**
     * List of all event factories
     *
     * The factories are used to generate events
     * The factories are registered by name
     * The factories can be overwritten
     *
     * @type {Map<string, WebEventFactory>}
     * @private
     */
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
    buffer: WebEvent[] = [];

    // This is the maximum size of the buffer
    // If the buffer is full, the events will be dropped
    static MAX_BUFFER_SIZE = 1000;

    /**
     * Recurrent tasks to limit by FPS
     *
     * They are used to limit the number of send events calls
     * They are used to prevent the browser from being overloaded (using requestAnimationFrame)
     *
     * @type {TaskManager[]}
     * @private
     */
    private tasks: TaskManager;

    /**
     * Event sender to send events to the server
     *
     * The sender is responsible for sending events to the server
     * The sender is limited to send one request at a time
     * The sender is limited to send events in batches (batch size as no limit)
     *
     * @type {EventSender}
     * @private
     */
    sender: EventSender;

    /**
     * List of all event listeners
     *
     * The listeners are used to listen to events on the page
     * The listeners are used to generate tracking events
     *
     * @type {Map<string, ListenerFn>}
     * @private
     */
    listenerRegistry: ListenerRefList = new Map<string, ListenerFn>();

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
     * Flag to check if the library has been initialized
     * @private
     */
    private initialized: boolean = false;

    // Logger to log messages to the console
    private logger: Logger = new Logger('GoPixel');

    constructor(cfg: GoPixelConfig) {
        this.config = cfg;
        this.logger.debug('Initialized with config', cfg);

        // creating context for the current visitor
        this.context = {
            visitor: uuidv4(), // todo: recover from local storage or cookie or create a new one
            vendor: cfg.licence,
        };

        // register all event factories
        this.registerFactory(EventName.DeviceInfo, new DeviceInfoFactory());
        this.registerFactory(EventName.PageLoad, new PageLoadFactory());
        this.registerFactory(EventName.PageLoad, new PageLoadFactory());

        // Creating TaskLimiter to handle parallel tasks
        this.tasks = new TaskManager();
        this.sender = new EventSender(this.context);

        // Send all events before closing the page
        this.sendEventBeforeUnload();
    }

    private sendEventBeforeUnload() {
        window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
            this.logger.debug('Destroying the library...');

            if (this.killSwitch || !this.isStarted) {
                // If the user has not given consent
                // We should not send any data
                return;
            }

            // Kill event recollection
            this.tasks.kill();
            this.logger.debug('Killed all subscriptions.');

            if (this.buffer.length === 0) {
                return;
            }

            // Prevent the page from closing
            e.preventDefault();
            this.logger.debug('Sent all events before closing the page.');

            this
                .sender
                .sendEvent(this.consume())
                .then(() => {
                    this.logger.debug('Sent all events before closing the page.');
                })
                .catch((error) => {
                    this.logger.error('Failed to send events before closing the page.', error);
                })
                .finally(() => {
                    // Close the window after sending the events
                    window.close();
                });
        });
    }

    /**
     * Starting collecting events in local buffer
     * until user gives consent to tracking,
     * only then we will start sending events
     * @private
     */
    public init() {
        if (this.initialized) {
            throw new Error('GoPixel is already initialized');
        }

        this.initialized = true;

        // Sending basic events
        this.pushEvent(EventName.DeviceInfo);
        this.pushEvent(EventName.PageLoad);

        this.initEventListeners();

        // Starting the task manager
        this.tasks.start();
    }

    private initEventListeners() {
        const logger = new Logger('EventListeners');

        this.listenerRegistry.set('click', (event: MouseEvent) => {
            logger.debug('Click event', event);
            this.push(new WebEvent('mouse_click', payloadFromMouseEvent(event)));
        });

        // creating listeners
        this.listenerRegistry.forEach((listener, event) => {
            window.addEventListener(event, listener);
            logger.debug('Added event listener', event);
        });
    }

    private destroyEventListeners() {
        // Remove all event listeners
        this.listenerRegistry.forEach((listener, event) => {
            window.removeEventListener(event, listener);
            this.logger.debug('Removed event listener', event);
        });
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
        this.logger.debug('Registered event', name);
    }

    public getFactory(name: EventName | string): WebEventFactory | undefined {
        return this.factories.get(name);
    }

    public pushEvent(name: EventName | string): void {
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
        if (this.buffer.length >= GoPixel.MAX_BUFFER_SIZE) {
            this.logger.debug('Buffer is full. Dropping event', event);
            return;
        }

        this.buffer.push(event);
    }

    /**
     * Start allowing buffer consumption
     */
    public start() {
        this.isStarted = true;

        // Adding send event task to the task manager
        const sender = sendEventTask(this);
        this.tasks.addTask(sender);
    }

    /**
     * Stop allowing buffer consumption
     * Stop all subscriptions and event listeners
     * Clear the current buffer
     * (Allow to stop tracking user activity when the user has not given consent)
     */
    public kill(): void {
        this.isStarted = false;

        this.tasks.kill();
        this.logger.debug('Killed all subscriptions.');

        this.destroyEventListeners();
        this.logger.debug('Destroyed all event listeners.');

        this.buffer = [];
        this.logger.log('Cleared events buffer.');
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
    public consume(): WebEvent[] {
        if (!this.isStarted) {
            this.logger.debug('Cannot consume events before the library has started');
            return [];
        }

        const events = this.buffer;
        this.buffer = [];

        return events;
    }
}