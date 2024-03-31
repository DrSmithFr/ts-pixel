import {WebEvent, WebEventFactory, WebEventPayload} from "./event";
import {locationPayload} from "./payload";

export class PageLoadFactory implements WebEventFactory {

    public create() {
        const event = new WebEvent('device-info')

        const finalPayload = (new WebEventPayload())
            .setPayload('user-agent', navigator.userAgent)
            .setPayload('title', document.title)
            .setPayload('referrer', document.referrer)
            .setPayload('location', locationPayload);

        return event.setPayload(finalPayload);
    }
}