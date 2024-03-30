import {GoPixelContext} from "../go-pixel";

/**
 * This interface provide a template tracking events.
 */
export interface WebEventFactory {
    create(): Promise<WebEvent> | WebEvent
}

// This type is used to define the payload of the event
// It is a simple key-value object, and can be nested
export class WebEventPayload {
    [key: string]: any

    public setPayload(key: string, value: any | WebEventPayload): this {
        if (value instanceof WebEventPayload) {
            value = cleanUp(value)
        }

        if (value === undefined || value === null) {
            this[key] = value
        }

        return this
    }
}

export class WebEvent {
    name: string
    payload: WebEventPayload | undefined

    public constructor(name: string) {
        this.name = name
    }

    public setPayload(payload: WebEventPayload): this {
        this.payload = cleanUp(payload)
        return this
    }

    // This method is used to convert the event to a JSON string
    public json(context: GoPixelContext): string {
        return JSON.stringify({
            name: this.name,
            context: context,
            payload: this.payload
        })
    }
}

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