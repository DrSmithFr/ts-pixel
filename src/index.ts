// Global variables for console debugging

import {GoPixel} from "./go-pixel";
import {loadConfiguration} from "./auto-loader-config";

// declare global variables for console debugging
declare global {
    interface Window {
        GoPixel: GoPixel | undefined;
    }
}

// Autoload the library
const config = loadConfiguration();

if (config) {
    window.GoPixel = new GoPixel(config);
} else {
    console.warn('GoPixel: Library cannot be autoloaded. waiting for manual initialization.');
}
