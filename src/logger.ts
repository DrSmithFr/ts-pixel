/**
 * Logger class to log messages to the console.
 * The prefix is set to 'GoPixel:'.
 *
 * Usage: console wrapper with a prefix, to prepare for future logging level features.
 */
export class Logger {
    static PREFIX = 'GoPixel:';

    public static debug(message: string, ...optionalParams: any[]) {
        console.debug(Logger.PREFIX + message, ...optionalParams);
    }

    public static log(message: string, ...optionalParams: any[]) {
        console.log(Logger.PREFIX + message, ...optionalParams);
    }

    public static info(message: string, ...optionalParams: any[]) {
        console.info(Logger.PREFIX + message, ...optionalParams);
    }

    public static error(message: string, ...optionalParams: any[]) {
        console.error(Logger.PREFIX + message, ...optionalParams);
    }

    public static warn(message: string, ...optionalParams: any[]) {
        console.warn(Logger.PREFIX + message, ...optionalParams);
    }

    public static time(label: string) {
        console.time(Logger.PREFIX + label);
    }

    public static timeEnd(label: string) {
        console.timeEnd(Logger.PREFIX + label);
    }
}