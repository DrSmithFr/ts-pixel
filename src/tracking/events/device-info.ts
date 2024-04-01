import {WebEvent, WebEventFactory, WebEventPayload} from "./event";
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
            .set('user-agent', navigator.userAgent)
            .set('language', languagePayload)
            .set('cookies', cookiesPayload)
            .set('screen', screenPayload);

        return new WebEvent('device-info', finalPayload);
    }
}