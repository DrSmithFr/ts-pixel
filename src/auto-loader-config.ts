import {GoPixelConfig} from "./go-pixel";

export function loadConfiguration(): GoPixelConfig | undefined {
    const script = document.currentScript;

    if (!script) {
        console.error('GoPixel: Library was not loaded inside a script tag.');
        return;
    }

    if (script instanceof SVGScriptElement) {
        console.error('GoPixel: Library was load inside a SVGScriptElement.');
        return;
    }

    const key = loadConfigFromScript(script, ['license', 'key',]);

    if (key === undefined) {
        console.error('GoPixel: No API key found.');
        return;
    }

    let domain = loadConfigFromScript(script, ['dns', 'shop', 'domain']);

    if (domain === undefined) {
        console.warn('GoPixel: No app domain found. Guessing domain...');
        domain = guessDomain();
    }

    return {
        apiKey: key,
        appDomain: domain
    }
}

function loadConfigFromScript(script: HTMLScriptElement, validParamName: string[]): string | undefined {
    // check for config in data attributes
    for (const key in validParamName) {
        if (script.dataset[key]) {
            return script.dataset[key];
        }
    }

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

function guessDomain() {
    const splitDomain = window.location.hostname.split('.').reverse();
    let firstLevelDomain = splitDomain[0];

    if (splitDomain[1] !== undefined) {
        firstLevelDomain = splitDomain[1] + '.' + firstLevelDomain;
    }

    return firstLevelDomain;
}