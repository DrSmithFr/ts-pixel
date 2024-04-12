import {Tracker} from "./tracking/tracker";
import {bootstrap} from "./auto-loader-config";
import {Logger} from "./utils/logger";

// declare global variables in window object
// This is necessary to access the library from outside the module
declare global {
    interface Window {
        GoPixel: Tracker | undefined;
    }
}

const log = new Logger('GoPixelIndex');

try {
    // Try to automatically initialize the library using the script tag
    // If the script tag does not contain the necessary configuration, it will wait for manual initialization
    log.time('Initialization')
    bootstrap();
} catch (e) {
    log.error('Initialization error:', e);
} finally {
    log.timeEnd('Initialization')
}

// Starting tracking outside off try-catch block
// This is necessary delegate error handling to TaskLimiter
window.GoPixel?.init();
