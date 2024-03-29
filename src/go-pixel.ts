export class GoPixelConfig {
    constructor(
        public apiKey: string,
        public appDomain: string,
    ) {
    }
}

export class GoPixel {
    constructor(
        private config: GoPixelConfig
    ) {
        console.log('GoPixel: Initialized with config', this.config);
    }
}