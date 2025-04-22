export declare class HtmlSafeString {
    private readonly strings;
    private readonly values;
    constructor(strings: readonly string[], values: unknown[]);
    toString(): string;
}
export type HtmlValue = string | number | boolean | bigint | HtmlSafeString | undefined | null | HtmlValue[];
export declare function html(strings: TemplateStringsArray, ...values: HtmlValue[]): HtmlSafeString;
/**
 * Pre-escapes the rendered HTML. Useful for when you want to inline the HTML
 * in something else, for instance in a `data-bs-content` attribute for a Bootstrap
 * popover.
 */
export declare function escapeHtml(html: HtmlSafeString): HtmlSafeString;
/**
 * Will render the provided value without any additional escaping. Use carefully
 * with user-provided data.
 *
 * @param value The value to render.
 * @returns An {@link HtmlSafeString} representing the provided value.
 */
export declare function unsafeHtml(value: string): HtmlSafeString;
/**
 * Joins a list of HTML values with a separator.
 *
 * @param values The values to join.
 * @param separator The separator to use between values.
 */
export declare function joinHtml(values: HtmlValue[], separator?: HtmlValue): HtmlSafeString;
