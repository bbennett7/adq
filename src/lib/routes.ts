export const routes = {
	question: (number: number) => `/q/${number}`,
	archive: '/archive',
	notes: '/notes',
	note: (slug: string) => `/notes/${slug}`,
};
