import {WebEventPayload} from "./event";

/**
 * This class is used to define the payload of the event
 * It is a simple key-value object, and can be nested
 */
export class Payload {
    static pageLoad(): WebEventPayload {
        return (new WebEventPayload())
            .set('user_agent', navigator.userAgent)
            .set('location', getLocationPayload())
            .set('document', payloadFromDocument())
    }

    static deviceInfo(): WebEventPayload {
        return (new WebEventPayload())
            .set('language', getLanguagePayload())
            .set('screen', getScreenPayload())
            .set('cookies', getCookiesPayload())
    }

    static mouseInfo(event: MouseEvent): WebEventPayload {
        return (new WebEventPayload())
            .set('event', payloadFromMouseEvent(event))
    }

    static interactionEnd(startAt: Date): WebEventPayload {
        return (new WebEventPayload())
            .set('duration_in_ms', new Date().getTime() - startAt.getTime())
    }

    /**
     * This function is used to clean up the payload before sending it to the server
     * It removes all the undefined and null values from the payload
     * It works recursively on nested payloads
     */
    static cleanUp(payload: WebEventPayload): WebEventPayload {
        const cleaned: WebEventPayload = new WebEventPayload()

        for (const key in payload) {
            if (payload.hasOwnProperty(key)) {
                if (payload[key] instanceof WebEventPayload) {
                    cleaned[key] = this.cleanUp(payload[key])
                } else {
                    if (payload[key] !== undefined && payload[key] !== null) {
                        cleaned[key] = payload[key]
                    }
                }
            }
        }

        return cleaned
    }
}

/**
 * Payloads for device related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator)
 */
function getLanguagePayload(): WebEventPayload {
    return (new WebEventPayload())
        .set('language', navigator.language)
        .set('languages', navigator.languages);
}

/**
 * Payloads for screen related data
 * collected from the screen, window and navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Screen)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/maxTouchPoints)
 */
function getScreenPayload(): WebEventPayload {
    return (new WebEventPayload())
        .set('width', screen.width)
        .set('height', screen.height)
        .set('color-depth', screen.colorDepth)
        .set('pixel-depth', screen.pixelDepth)
        .set('pixel-ratio', window.devicePixelRatio)
        .set('max-touch-points', navigator.maxTouchPoints);
}

/**
 * Payloads for cookies related data
 * collected from the navigator object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/cookieEnabled)
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Navigator/doNotTrack)
 */
function getCookiesPayload(): WebEventPayload {
    return (new WebEventPayload())
        .set('enabled', navigator.cookieEnabled)
        .set('do-not-track', Boolean(navigator.doNotTrack));
}

/**
 * Payloads for page location
 * collected from the window.location object
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Location)
 */
function getLocationPayload(): WebEventPayload {
    return (new WebEventPayload())
        .set('protocol', window.location.protocol)
        .set('host', window.location.host)
        .set('port', window.location.port)
        .set('hostname', window.location.hostname)
        .set('href', window.location.href)
        .set('origin', window.location.origin)
        .set('pathname', window.location.pathname);
}

function payloadFromDocument(): WebEventPayload {
    const payload = new WebEventPayload();

    payload.set('title', document.title);
    payload.set('referrer', document.referrer);
    payload.set('url', document.URL);
    payload.set('last-modified', document.lastModified);
    payload.set('ready-state', document.readyState);
    payload.set('visibility-state', document.visibilityState);
    payload.set('seo', payloadSEO());


    return payload;
}

function payloadSEO(): WebEventPayload {
    const payload = new WebEventPayload();

    payload.set('description', document.querySelector('meta[name="description"]')?.getAttribute('content'));
    payload.set('keywords', document.querySelector('meta[name="keywords"]')?.getAttribute('content'));
    payload.set('canonical', document.querySelector('link[rel="canonical"]')?.getAttribute('href'));

    // Add all the meta tags
    payload.set('metas', payloadFromMeta);

    // Add first heading tags from h1 to h6
    const listOfHeadTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    for (const tag of listOfHeadTags) {
        const h1 = document.getElementsByTagName(tag);
        if (h1.length > 0 && h1[0] instanceof HTMLElement) {
            payload.set('first-' + tag, h1[0].innerText);
        }
    }

    return payload;
}

function payloadFromMeta(): WebEventPayload {
    const payload = new WebEventPayload();
    const meta = document.getElementsByTagName('meta');

    for (let i = 0; i < meta.length; i++) {
        const element = meta.item(i);

        if (element && element.name) {
            payload.set(element.name, element.content);
        }
    }

    return payload;
}

function payloadFromLink(): WebEventPayload {
    const selector = new Map<string, string>();

    selector.set('apple-pay-shop-capabilities', 'script[type="application/json"][id="apple-pay-shop-capabilities"]');
    selector.set('shopify-features', 'script[type="application/json"][id="shopify-features"]');


    const payload = new WebEventPayload();
    selector.forEach((value, key) => {
        const innerHtml = getInnerHtml(value);
        if (innerHtml) {
            payload.set(key, innerHtml);
        }
    });

    return payload;
}

function getInnerHtml(selector: string): string|undefined {
    const scriptElement = document.querySelector(selector);

    if (!scriptElement) {
        return undefined;
    }

    return scriptElement.innerHTML;
}

function payloadFromMouseEvent(event: MouseEvent): WebEventPayload {
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

function payloadFromHTMLElement(element: HTMLElement): WebEventPayload {
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

function payloadAttrFromHTMLElement(element: HTMLElement): WebEventPayload | undefined {
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

function payloadDataFromHTMLElement(element: HTMLElement): WebEventPayload | undefined {
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