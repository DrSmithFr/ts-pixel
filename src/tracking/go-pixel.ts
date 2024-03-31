import {Logger} from "../logger";
import {WebEvent, WebEventFactory} from "./events/event";
import {DeviceInfoFactory} from "./events/device-info";
import {TaskManager} from "./tasks/task-manager";
import {EventSender} from "./tasks/event-sender";
import {sendEventTask} from "./tasks/event-sender-task";
import {PageLoadFactory} from "./events/page-load";

export type Uuid = string;

export type GoPixelContext = {
    client: Uuid,
    visitor: Uuid,

    page?: Uuid,
    variant?: Uuid,
}

export type GoPixelConfig = {
    licence: string,
    domain: string,
}


enum EventName {
    PageLoad = 'page_load',
    DeviceInfo = 'device_info',
}

export class GoPixel {
    /**
     * Global configuration for the library
     */
    public config: GoPixelConfig;

    /**
     * Context of the current visitor
     */
    public context: GoPixelContext|undefined = undefined;

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

    sender: EventSender;

    /**
     * Flag to check if the library should start sending events
     * @private
     */
    private isStarted: boolean = false;

    // Logger to log messages to the console
    private logger: Logger = new Logger('GoPixel');

    constructor(cfg: GoPixelConfig) {
        this.config = cfg;
        this.logger.debug('Initialized with config', cfg);

        // creating context for the current visitor
        this.context = {
            visitor: 'unique-visitor-id', // todo: recover from local storage or cookie or create a new one
            client: cfg.licence,
        };

        // register all event factories
        this.registerFactory(EventName.DeviceInfo, new DeviceInfoFactory());
        this.registerFactory(EventName.PageLoad, new PageLoadFactory());

        // Creating TaskLimiter to handle parallel tasks
        this.tasks = new TaskManager();
        this.sender = new EventSender(this.context);
    }

    /**
     * Starting collecting events in local buffer
     * until user gives consent to tracking,
     * only then we will start sending events
     * @private
     */
    public init() {
        // Sending basic events
        this.pushEvent(EventName.DeviceInfo);
        this.pushEvent(EventName.PageLoad);

        // Starting the task manager
        this.tasks.start();
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