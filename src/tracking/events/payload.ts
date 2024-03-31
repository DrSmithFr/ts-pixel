import {WebEventPayload} from "./event";

/**
 * Payloads for device related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator)
 */
export const languagePayload = (new WebEventPayload())
    .setPayload('language', navigator.language)
    .setPayload('languages', navigator.languages);

/**
 * Payloads for screen related data
 * collected from the screen, window and navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/maxTouchPoints)
 */
export const screenPayload = (new WebEventPayload())
    .setPayload('width', screen.width)
    .setPayload('height', screen.height)
    .setPayload('color-depth', screen.colorDepth)
    .setPayload('pixel-depth', screen.pixelDepth)
    .setPayload('pixel-ratio', window.devicePixelRatio)
    .setPayload('max-touch-points', navigator.maxTouchPoints);

/**
 * Payloads for cookies related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/cookieEnabled)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/doNotTrack)
 */
export const cookiesPayload = (new WebEventPayload())
    .setPayload('enabled', navigator.cookieEnabled)
    .setPayload('do-not-track', Boolean(navigator.doNotTrack));

/**
 * Payloads for page location
 * collected from the window.location object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Location)
 */
export const locationPayload = (new WebEventPayload())
    .setPayload('protocol', window.location.protocol)
    .setPayload('host', window.location.host)
    .setPayload('port', window.location.port)
    .setPayload('hostname', window.location.hostname)
    .setPayload('href', window.location.href)
    .setPayload('origin', window.location.origin)
    .setPayload('pathname', window.location.pathname);