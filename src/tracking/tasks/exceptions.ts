export class HardFailureException extends Error {
    constructor(e: Error) {
        super(e.message);
        this.name = 'TaskManager: HardFailureException ' + e.name;
        this.stack = e.stack;
    }
}

export class SoftFailureException extends Error {
    constructor(e: Error) {
        super(e.message);
        this.name = 'TaskManager: SoftFailureException ' + e.name;
        this.stack = e.stack;
    }
}

export class SilentFailureException extends Error {
    constructor(e: Error) {
        super(e.message);
        this.name = 'TaskManager: SilentFailureException ' + e.name;
        this.stack = e.stack;
    }
}