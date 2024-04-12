/**
 * Logger class to log messages to the console.
 * The prefix is set to 'Tracker:'.
 *
 * Usage: console wrapper with a prefix, to prepare for future logging level features.
 */
export class Logger {
    private readonly prefix: string = '';

    constructor(
        prefix?: string
    ) {
        if (prefix) {
            this.prefix = prefix + ': ';
        }
    }

    public debug(message: string, ...optionalParams: any[]) {
        console.debug(this.prefix + message, ...optionalParams);
    }

    public log(message: string, ...optionalParams: any[]) {
        console.log(this.prefix + message, ...optionalParams);
    }

    public info(message: string, ...optionalParams: any[]) {
        console.info(this.prefix + message, ...optionalParams);
    }

    public error(message: string, ...optionalParams: any[]) {
        console.error(this.prefix + message, ...optionalParams);
    }

    public warn(message: string, ...optionalParams: any[]) {
        console.warn(this.prefix + message, ...optionalParams);
    }

    public time(label: string) {
        console.time(this.prefix + label);
    }

    public timeEnd(label: string) {
        console.timeEnd(this.prefix + label);
    }
}