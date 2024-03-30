import {GoPixel} from "./tracking/go-pixel";
import {bootstrap} from "./tracking/auto-loader-config";
import {Logger} from "./logger";

// declare global variables in window object
// This is necessary to access the library from outside the module
declare global {
    interface Window {
        GoPixel: GoPixel | undefined;
    }
}

try {
    // Try to automatically initialize the library using the script tag
    // If the script tag does not contain the necessary configuration, it will wait for manual initialization
    bootstrap();
} catch (e) {
    Logger.error('GoPixel: Error during initialization', e);
}


