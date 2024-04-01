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

export function payloadFromMouseEvent(event: MouseEvent): WebEventPayload {
    const payload = (new WebEventPayload())
        .set('x', event.clientX)
        .set('y', event.clientY)
        .set('pageX', event.pageX)
        .set('pageY', event.pageY)
        .set('screenX', event.screenX)
        .set('screenY', event.screenY)
        .set('button', event.button)
        .set('buttons', event.buttons);

    if (event.target) {
        payload.set('target', payloadFromHTMLElement(event.target as HTMLElement));
    }

    return payload;
}

export function payloadFromHTMLElement(element: HTMLElement): WebEventPayload {
    const payload = (new WebEventPayload())
        .set('tag', element.tagName.toLocaleLowerCase())
        .set('id', element.id)
        .set('class', element.className)
        .set('attr', payloadAttrFromHTMLElement(element))
        .set('data', payloadDataFromHTMLElement(element));

    // List of small enough tags to collect the text
    const tagWhitelist = ['A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN'];

    if (tagWhitelist.includes(element.tagName)) {
        payload
            .set('text', element.innerText)
    }

    return payload;
}

export function payloadAttrFromHTMLElement(element: HTMLElement): WebEventPayload | undefined {
    const payload = new WebEventPayload();

    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i);
        if (attr) {
            payload.set(attr.name, attr.value);
        }
    }

    if (payload.size() === 0) {
        return undefined;
    }

    return payload;
}

export function payloadDataFromHTMLElement(element: HTMLElement): WebEventPayload | undefined {
    const payload = new WebEventPayload();
    const dataAttr = element.dataset;

    for (const key in dataAttr) {
        if (dataAttr.hasOwnProperty(key)) {
            payload.set(`data-${key}`, dataAttr[key]);
        }
    }

    if (payload.size() === 0) {
        return undefined;
    }

    return payload;
}
