import {WebEventPayload} from "./event";

/**
 * Payloads for device related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator)
 */
export const languagePayload = (new WebEventPayload())
    .set('language', navigator.language)
    .set('languages', navigator.languages);

/**
 * Payloads for screen related data
 * collected from the screen, window and navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/maxTouchPoints)
 */
export const screenPayload = (new WebEventPayload())
    .set('width', screen.width)
    .set('height', screen.height)
    .set('color-depth', screen.colorDepth)
    .set('pixel-depth', screen.pixelDepth)
    .set('pixel-ratio', window.devicePixelRatio)
    .set('max-touch-points', navigator.maxTouchPoints);

/**
 * Payloads for cookies related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/cookieEnabled)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/doNotTrack)
 */
export const cookiesPayload = (new WebEventPayload())
    .set('enabled', navigator.cookieEnabled)
    .set('do-not-track', Boolean(navigator.doNotTrack));

/**
 * Payloads for page location
 * collected from the window.location object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Location)
 */
export const locationPayload = (new WebEventPayload())
    .set('protocol', window.location.protocol)
    .set('host', window.location.host)
    .set('port', window.location.port)
    .set('hostname', window.location.hostname)
    .set('href', window.location.href)
    .set('origin', window.location.origin)
    .set('pathname', window.location.pathname);