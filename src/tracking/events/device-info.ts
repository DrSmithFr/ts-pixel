import {WebEventPayload, WebEvent, WebEventFactory} from "./event";
import {cookiesPayload, languagePayload, screenPayload} from "./payload";

export class DeviceInfoFactory implements WebEventFactory {
    public create() {
        const event = new WebEvent('device-info')

        const finalPayload = (new WebEventPayload())
            .setPayload('user-agent', navigator.userAgent)
            .setPayload('language', languagePayload)
            .setPayload('cookies', cookiesPayload)
            .setPayload('screen', screenPayload);

        return event.setPayload(finalPayload);
    }
}