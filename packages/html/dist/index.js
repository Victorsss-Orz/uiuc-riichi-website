const ENCODE_HTML_RULES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&#34;',
    "'": '&#39;',
};
const MATCH_HTML = /[&<>'"]/g;
function encodeCharacter(c) {
    return ENCODE_HTML_RULES[c] || c;
}
/**
 * Based on the `escapeXML` function from the `ejs` library.
 */
function escapeHtmlRaw(value) {
    return value == null ? '' : String(value).replace(MATCH_HTML, encodeCharacter);
}
function escapeValue(value) {
    if (value instanceof HtmlSafeString) {
        // Already escaped!
        return value.toString();
    }
    else if (Array.isArray(value)) {
        return value.map((val) => escapeValue(val)).join('');
    }
    else if (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint' ||
        typeof value === 'boolean') {
        return escapeHtmlRaw(String(value));
    }
    else if (value == null) {
        // undefined or null -- render nothing
        return '';
    }
    else if (typeof value === 'object') {
        throw new Error(`Cannot interpolate object in template: ${JSON.stringify(value)}`);
    }
    else {
        // There shouldn't be any other types
        throw new Error(`Unexpected type in template: ${typeof value} for value ${JSON.stringify(value)}`);
    }
}
// Based on https://github.com/Janpot/escape-html-template-tag
export class HtmlSafeString {
    strings;
    values;
    constructor(strings, values) {
        this.strings = strings;
        this.values = values;
    }
    toString() {
        return this.values.reduce((acc, val, i) => {
            return acc + escapeValue(val) + this.strings[i + 1];
        }, this.strings[0]);
    }
}
export function html(strings, ...values) {
    return new HtmlSafeString(strings, values);
}
/**
 * Pre-escapes the rendered HTML. Useful for when you want to inline the HTML
 * in something else, for instance in a `data-bs-content` attribute for a Bootstrap
 * popover.
 */
export function escapeHtml(html) {
    return unsafeHtml(escapeHtmlRaw(html.toString()));
}
/**
 * Will render the provided value without any additional escaping. Use carefully
 * with user-provided data.
 *
 * @param value The value to render.
 * @returns An {@link HtmlSafeString} representing the provided value.
 */
export function unsafeHtml(value) {
    return new HtmlSafeString([value], []);
}
/**
 * Joins a list of HTML values with a separator.
 *
 * @param values The values to join.
 * @param separator The separator to use between values.
 */
export function joinHtml(values, separator = '') {
    return unsafeHtml(values.map(escapeValue).join(escapeValue(separator)));
}
//# sourceMappingURL=index.js.map