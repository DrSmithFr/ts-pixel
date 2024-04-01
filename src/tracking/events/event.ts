/**
 * This interface provide a template for tracking events generation.
 */
export interface WebEventFactory {
    create(): Promise<WebEvent> | WebEvent
}

/**
 * This class is used to define the payload of the event
 * It is a simple key-value object, and can be nested
 */
export class WebEventPayload {
    [key: string]: any | WebEventPayload

    public set(key: string, value: any | WebEventPayload): this {
        this[key] = value
        return this
    }

    public size(): number {
        return Object.keys(this).length
    }
}

/**
 * This class is used to define a tracking event
 */
export class WebEvent {
    type: string
    payload: WebEventPayload | undefined
    createdAt: Date;

    public constructor(type: string, payload: WebEventPayload) {
        this.type = type
        this.createdAt = new Date()
        this.payload = cleanUp(payload)
    }

    public object(): object {
        return {
            type: this.type,
            payload: this.payload,
            created_at: this.createdAt.toISOString()
        }
    }
}

/**
 * This function is used to clean up the payload before sending it to the server
 * It removes all the undefined and null values from the payload
 * It works recursively on nested payloads
 */
function cleanUp(payload: WebEventPayload): WebEventPayload {
    const cleaned: WebEventPayload = new WebEventPayload()

    for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
            if (payload[key] instanceof WebEventPayload) {
                cleaned[key] = cleanUp(payload[key])
            } else {
                if (payload[key] !== undefined && payload[key] !== null) {
                    cleaned[key] = payload[key]
                }
            }
        }
    }

    return cleaned
}