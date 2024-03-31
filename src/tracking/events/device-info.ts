import {WebEventPayload, WebEvent, WebEventFactory} from "./event";
import {cookiesPayload, languagePayload, screenPayload} from "./payload";

/**
 * DeviceInfo is fired when the page is loaded
 *
 * It contains about:
 * - User Agent
 * - Language
 * - Cookies
 * - Screen
 */
export class DeviceInfoFactory implements WebEventFactory {
    public create() {
        const finalPayload = (new WebEventPayload())
            .setPayload('user-agent', navigator.userAgent)
            .setPayload('language', languagePayload)
            .setPayload('cookies', cookiesPayload)
            .setPayload('screen', screenPayload);

        return new WebEvent('device-info', finalPayload);
    }
}