import {WebEventPayload} from "./event";

export const languagePayload = (new WebEventPayload())
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/language) */
    .setPayload('language', navigator.language)
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/languages) */
    .setPayload('languages', navigator.languages);

export const screenPayload = (new WebEventPayload())
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

export const cookiesPayload = (new WebEventPayload())
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/cookieEnabled) */
    .setPayload('enabled', navigator.cookieEnabled)
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/doNotTrack) */
    .setPayload('do-not-track', Boolean(navigator.doNotTrack));

export const locationPayload = (new WebEventPayload())
    .setPayload('protocol', window.location.protocol)
    .setPayload('host', window.location.host)
    .setPayload('port', window.location.port)
    .setPayload('hostname', window.location.hostname)
    .setPayload('href', window.location.href)
    .setPayload('origin', window.location.origin)
    .setPayload('pathname', window.location.pathname);