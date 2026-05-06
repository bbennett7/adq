import type { ResourceLink } from '@/lib/schemas';

export function ResourceLinks({ links }: { links: ResourceLink[] }) {
	if (!links.length) return null;

	return (
		<section className="resource-links">
			<h2 className="resource-links-head">Resources</h2>
			<ul className="resource-links-list">
				{links.map((link, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static list, URLs are not guaranteed unique
					<li key={`resource-${i}`}>
						<a href={link.url} target="_blank" rel="noopener noreferrer">
							<span className="resource-links-label">{link.label}</span>
							<span className="resource-links-source">
								{link.author ? `${link.author} · ${link.source}` : link.source}
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
