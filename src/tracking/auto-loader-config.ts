import {GoPixel, GoPixelConfig} from "./go-pixel";
import {Logger} from "../logger";

/**
 * Load the configuration from the script tag.
 * If the configuration is found, the library will be initialized.
 *
 * Library can be accessed from the window object using the window.GoPixel variable.
 *
 * The configuration can be loaded from the script tag in two ways:
 *  - Either by using data attributes or by using query parameters.
 *  - Both methods are case-sensitive and can be combined.
 *
 * The script tag can have the following data attributes:
 * - data-license (preferred) | data-key
 * - data-domain (preferred) | data-shop
 *
 * Or can have the following query parameters:
 * - license (preferred) | key
 * - shop (preferred for shopify apps) | domain
 *
 * If the domain is not provided, it will be guessed from the current hostname.
 * If the hostname is an IP address, the domain will be the IP address.
 * If the hostname is a top-level domain, the domain will be the hostname.
 * If the hostname is a subdomain, the domain will be the top-level domain.
 */
export function bootstrap(): void {
    if (navigator.doNotTrack === '1') {
        Logger.info('GoPixel: Do Not Track is enabled. Tracking has been disabled.');
        return;
    }

    const config = loadConfiguration();

    if (!config) {
        Logger.info('GoPixel: No configuration found. Waiting for manual initialization.');
        return;
    }

    window.GoPixel = new GoPixel(config);
}


function loadConfiguration(): GoPixelConfig | undefined {
    const script = document.currentScript;

    if (!script) {
        Logger.error('Library was not loaded inside a script tag.');
        return;
    }

    if (script instanceof SVGScriptElement) {
        Logger.error('Library was load inside a SVGScriptElement.');
        return;
    }

    const licence = loadConfigFromHTMLScriptElement(script, ['key', 'license']);

    if (licence === undefined) {
        Logger.error('No licence key found.');
        return;
    }

    let domain = loadConfigFromHTMLScriptElement(script, ['shop', 'domain']);

    if (domain === undefined) {
        Logger.log('No app domain found. Guessing domain...');

        const hostname = window.location.hostname;
        domain = guessFirstLevelDomain(hostname);

        Logger.log('Guessed domain ', domain);
    }

    return {
        licence: licence,
        domain: domain,
    }
}

// Load configuration from script tag
// Both data attributes and query parameters are case sensitive
// Both methods can be combined
function loadConfigFromHTMLScriptElement(script: HTMLScriptElement, validParamName: string[]): string | undefined {
    const param = searchParamInDataAttributes(script, validParamName);
    return param || searchParamInQueryParams(script, validParamName);
}

// Search for a parameter in the data attributes of a script tag
function searchParamInDataAttributes(script: HTMLScriptElement, validParamName: string[]): string | undefined {
    for (const key in validParamName) {
        if (script.dataset[key]) {
            return script.dataset[key];
        }
    }
}


// Search for a parameter in the query parameters of a script tag
function searchParamInQueryParams(script: HTMLScriptElement, validParamName: string[]): string | undefined {
    const url = new URL(script.src);
    const urlParams = new URLSearchParams(url.search);

    // check if current script tag has key query param
    for (const key of validParamName) {
        const value = urlParams.get(key);
        if (value) {
            return value;
        }
    }
}

// Guess the first level domain from the current hostname
// Example: www.example.com -> example.com
function guessFirstLevelDomain(hostname: string): string {
    // local-domain is a special case
    if (!hostname.includes('.')) {
        return hostname;
    }

    // Check if the hostname is an IP address
    if (isIpAddress(hostname)) {
        return hostname;
    }

    const extension = getHostnameExtension(hostname);
    const hostnameWithoutExtension = hostname.slice(0, -extension.length);

    const parts = hostnameWithoutExtension.split('.');
    return parts.slice() + extension;
}

// Check if a hostname is an IP address
// Example: 127.0.0.1 -> true
function isIpAddress(hostname: string): boolean {
    const ipExpression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    return ipExpression.test(hostname);
}

// Extract the top level domain from a hostname
// Example: www.example.com -> .com
// Example: www.example.co.uk -> .co.uk
function getHostnameExtension(hostname: string): string {
    const topDomainExpression = /\w+((\.[a-z]{2,3})(\.(ad|ae|af|ag|ai|al|am|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bl|bm|bn|bo|bq|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mf|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw))?)$/i;
    const match = topDomainExpression.exec(hostname);

    if (!match) {
        throw new Error('Could not extract top level domain from hostname');
    }

    return match[1];
}