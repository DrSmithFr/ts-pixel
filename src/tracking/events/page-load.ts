import {WebEventPayload, WebEvent, WebEventFactory} from "./event";

export class PageLoadFactory implements WebEventFactory {

    public create() {
        const event = new WebEvent('device-info')

        const locationPayload = (new WebEventPayload())
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen) */
            .setPayload('width', screen.width)
            .setPayload('url', window.location.href)
            .setPayload('referrer', document.referrer)
            .setPayload('title', document.title);

        const finalPayload = (new WebEventPayload())
            .setPayload('url', window.location.href)
            .setPayload('referrer', document.referrer)
            .setPayload('title', document.title);

        return event.setPayload(finalPayload);
    }
}