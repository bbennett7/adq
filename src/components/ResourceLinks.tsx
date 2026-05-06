import type { ResourceLink } from '@/lib/schemas';

export function ResourceLinks({ links }: { links: ResourceLink[] }) {
	if (!links.length) return null;

	return (
		<section className="further-reading">
			<h2 className="further-reading-head">Resources</h2>
			<ul className="further-reading-list">
				{links.map((link, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static list, URLs are not guaranteed unique
					<li key={`resource-${i}`}>
						<a href={link.url} target="_blank" rel="noopener noreferrer">
							<span className="further-reading-label">{link.label}</span>
							<span className="further-reading-source">
								{link.author ? `${link.author} · ${link.source}` : link.source}
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
