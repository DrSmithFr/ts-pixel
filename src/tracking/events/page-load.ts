import {WebEvent, WebEventFactory, WebEventPayload} from "./event";
import {locationPayload} from "./payload";

/**
 * PageLoad is fired when the page is loaded
 *
 * It contains about:
 * - User Agent
 * - Title
 * - Referrer
 * - Location
 */
export class PageLoadFactory implements WebEventFactory {
    public create() {
        const finalPayload = (new WebEventPayload())
            .set('user-agent', navigator.userAgent)
            .set('title', document.title)
            .set('referrer', document.referrer)
            .set('location', locationPayload);

        return new WebEvent('page-load', finalPayload);
    }
}