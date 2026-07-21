/**
 * First `maxChars` of `text` with whitespace flattened, cut back to a word
 * boundary with an ellipsis. Used for note meta descriptions and OG cards.
 */
export function excerpt(text: string, maxChars = 160): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	if (flat.length <= maxChars) return flat;
	const slice = flat.slice(0, maxChars);
	const lastSpace = slice.lastIndexOf(' ');
	return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}
