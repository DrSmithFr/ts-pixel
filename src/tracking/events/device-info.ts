import {WebEventPayload, WebEvent, WebEventFactory} from "./event";

export class DeviceInfoFactory implements WebEventFactory {
    public create() {
        const event = new WebEvent('device-info')

        const languagePayload = (new WebEventPayload())
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/language) */
            .setPayload('language', navigator.language)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/languages) */
            .setPayload('languages', navigator.languages);

        const cookiesPayload = (new WebEventPayload())
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/cookieEnabled) */
            .setPayload('enabled', navigator.cookieEnabled)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/doNotTrack) */
            .setPayload('do-not-track', Boolean(navigator.doNotTrack));

        const screenPayload = (new WebEventPayload())
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen/width) */
            .setPayload('width', screen.width)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen/height) */
            .setPayload('height', screen.height)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen/colorDepth) */
            .setPayload('color-depth', screen.colorDepth)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen/pixelDepth) */
            .setPayload('pixel-depth', screen.pixelDepth)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio) */
            .setPayload('pixel-ratio', window.devicePixelRatio)
            /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/maxTouchPoints) */
            .setPayload('max-touch-points', navigator.maxTouchPoints);

        const finalPayload = (new WebEventPayload())
            .setPayload('language', languagePayload)
            .setPayload('cookies', cookiesPayload)
            .setPayload('screen', screenPayload);

        return event.setPayload(finalPayload);
    }
}