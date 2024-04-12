import {Payload} from "./payload";

/**
 * This enum is used to define common type of the events
 */
export enum EventType {
    PageLoad = 'Common::PageLoad',
    DeviceInfo = 'Common::DeviceInfo',
    InteractionEnd = 'Common::InteractionEnd',

    MouseEvent = 'Javascript::MouseEvent',
    ClickEvent = 'Javascript::ClickEvent',

    GtagEventPrefix = 'Gtag::',
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
        this.payload = Payload.cleanUp(payload)
    }

    public object(): object {
        return {
            type: this.type,
            payload: this.payload,
            created_at: this.createdAt.toISOString()
        }
    }

    static pageLoad(): WebEvent {
        return new WebEvent(EventType.PageLoad, Payload.pageLoad())
    }

    static deviceInfo(): WebEvent {
        return new WebEvent(EventType.DeviceInfo, Payload.deviceInfo())
    }

    static mouseInfo(event: MouseEvent): WebEvent {
        return new WebEvent(EventType.MouseEvent, Payload.mouseInfo(event))
    }

    static interactionEnd(startAt: Date): WebEvent {
        return new WebEvent(EventType.InteractionEnd, Payload.interactionEnd(startAt))
    }
}