import {Logger} from "../utils/logger";
import {WebEvent} from "./events/event";
import {TaskManager} from "./tasks/task-manager";
import {v4 as uuidv4} from 'uuid';
import {EventSender} from "./tasks/events-sender";
import {LibraryConfig} from "../auto-loader-config";

export type Uuid = string;

export type TrackingContext = {
    client: Uuid,
    visitor: Uuid,
    alteration?: AlterationContext
}

export type AlterationContext = {
    page: Uuid,
    alter: Uuid,
}

type ListenerFn = (event: any) => void;
type ListenerRefList = Map<string, ListenerFn>;

export class Tracker {
    /**
     * Context of the current visitor
     */
    public context: TrackingContext | undefined = undefined;

    /**
     * Recurrent tasks to limit by FPS
     *
     * They are used to limit the number of send events calls
     * They are used to prevent the browser from being overloaded (using requestAnimationFrame)
     */
    private tasks: TaskManager;

    /**
     * Event queue to store events
     *
     * The queue is used to store events before sending them to the server
     * The queue is used to limit the number of send events calls
     * The queue is used to prevent the browser from being overloaded
     *
     * @type {EventSender}
     * @private
     */
    private sender: EventSender;

    /**
     * List of all event listeners
     *
     * The listeners are used to listen to events on the page
     * The listeners are used to generate tracking events
     *
     * @type {Map<string, ListenerFn>}
     * @private
     */
    private listenerRegistry: ListenerRefList = new Map<string, ListenerFn>();

    /**
     * Flag to check if the library has been initialized
     * @private
     */
    private initialized: boolean = false;

    // Logger to log messages to the console
    private logger: Logger = new Logger('Tracker');

    constructor(cfg: LibraryConfig) {
        this.logger.debug('Initialized with config', cfg);

        // creating context for the current visitor
        this.context = {
            visitor: uuidv4(), // todo: recover from local storage or cookie or create a new one
            client: cfg.licence,
        };

        // Creating TaskLimiter to handle parallel tasks
        this.tasks = new TaskManager();
        this.sender = new EventSender(this.context);
    }

    private enableSendLastEvent() {
        window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
            this.flush();
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
            throw new Error('Tracker is already initialized');
        }

        // Sending basic events
        this.push(WebEvent.deviceInfo());
        this.push(WebEvent.pageLoad());

        // Starting the event listeners
        this.initialized = true;
        this.initEventListeners();

        // Starting the task manager
        this.tasks.start();
    }

    private initEventListeners() {
        const logger = new Logger('EventListeners');

        this.listenerRegistry.set('click', (event: MouseEvent) => {
            logger.debug('Click event', event);
            this.push(WebEvent.mouseInfo(event));
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
     * Send event in the buffer
     *
     * This method can be called before the library start
     * This method can be called multiple times
     *
     * When the buffer is full, the event keep being dropped
     * (Allow to track user activity before receiving consent to send data to the server)
     */
    public push(event: WebEvent): boolean {
        return this.sender.push(event);
    }

    /**
     * Flush all events in the buffer
     *
     * This method can be called before the library start
     * This method can be called multiple times
     *
     * When the buffer is full, the event keep being dropped
     * (Allow to track user activity before receiving consent to send data to the server)
     */
    public flush() {
        if (!this.initialized) {
            this.logger.warn('Tracker is not initialized. Events will not be sent.');
            return;
        }

        this
            .sender
            .sendEvents()
            .subscribe(
                {
                    next: (result) => {
                        if (result) {
                            this.logger.debug('All events sent.');
                        } else {
                            this.logger.warn('Failed to send all events.');
                        }
                    },
                    error: (error) => {
                        this.logger.error('Failed to send all events.', error);
                    }
                }
            );
    }

    /**
     * Start allowing buffer consumption
     */
    public start() {
        // Send all events before closing the page
        this.enableSendLastEvent();

        // Adding send event task to the task manager
        const sender = this.sender.makeTask();
        this.tasks.addTask(sender).active = true

        // Allow queue to start consuming events
        this.sender.start();
    }

    /**
     * Stop allowing buffer consumption
     * Stop all subscriptions and event listeners
     * Clear the current buffer
     * (Allow to stop tracking user activity when the user has not given consent)
     */
    public kill(): void {
        this.destroyEventListeners();
        this.tasks.kill();
        this.sender.kill();
    }
}