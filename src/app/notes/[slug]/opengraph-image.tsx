import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { excerpt } from '@/lib/excerpt';
import { fieldNoteService } from '@/lib/services/field-note.service';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'askdumbquestions.ai — field note';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const INK_SURFACE = 'rgb(20, 18, 16)';
const CREAM = 'rgb(232, 221, 208)';
const CREAM_META = 'rgba(232, 221, 208, 0.58)';
const CREAM_BODY = 'rgba(232, 221, 208, 0.72)';
const CREAM_RULE = 'rgba(232, 221, 208, 0.14)';
const ACCENT = '#ccbfa8';

async function loadFont(file: string) {
	const data = await readFile(join(process.cwd(), 'public/fonts', file));
	return data.buffer.slice(
		data.byteOffset,
		data.byteOffset + data.byteLength,
	) as ArrayBuffer;
}

type Params = { params: Promise<{ slug: string }> };

export default async function OGImage({ params }: Params) {
	const { slug } = await params;
	const note = SLUG_PATTERN.test(slug)
		? await fieldNoteService.getNote(slug)
		: null;

	const [wordmarkFont, titleFont, bodyFont, monoFont, monoMediumFont] =
		await Promise.all([
			loadFont('GowunBatang-Regular.ttf'),
			loadFont('ElmsSans-Medium-latin.ttf'),
			loadFont('FanwoodText-Regular-latin.ttf'),
			loadFont('IBMPlexMono-Regular-latin.ttf'),
			loadFont('IBMPlexMono-Medium-latin.ttf'),
		]);

	const fonts = [
		{
			name: 'Gowun Batang',
			data: wordmarkFont,
			style: 'normal' as const,
			weight: 400 as const,
		},
		{
			name: 'Elms Sans',
			data: titleFont,
			style: 'normal' as const,
			weight: 500 as const,
		},
		{
			name: 'Fanwood Text',
			data: bodyFont,
			style: 'normal' as const,
			weight: 400 as const,
		},
		{
			name: 'IBM Plex Mono',
			data: monoFont,
			style: 'normal' as const,
			weight: 400 as const,
		},
		{
			name: 'IBM Plex Mono',
			data: monoMediumFont,
			style: 'normal' as const,
			weight: 500 as const,
		},
	];

	const title = note ? excerpt(note.title, 130) : null;
	const longTitle = title !== null && title.length > 60;
	const description = note?.bodyPt
		? excerpt(note.bodyPt, longTitle ? 120 : 160)
		: null;
	const published = note
		? new Date(note.publishedAt).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC',
			})
		: null;

	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				width: '100%',
				height: '100%',
				background: INK_SURFACE,
				flexDirection: 'column',
				padding: '64px 72px 72px',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'baseline',
				}}
			>
				<div
					style={{
						fontFamily: 'Gowun Batang, serif',
						fontSize: '40px',
						lineHeight: 1,
						letterSpacing: '-0.02em',
						color: CREAM,
					}}
				>
					askdumbquestions.ai
				</div>
				<div
					style={{
						fontFamily: 'IBM Plex Mono',
						fontWeight: 500,
						fontSize: '20px',
						textTransform: 'uppercase',
						letterSpacing: '0.14em',
						color: ACCENT,
					}}
				>
					Field notes
				</div>
			</div>
			<div
				style={{
					width: '100%',
					height: '2px',
					background: CREAM_RULE,
					marginTop: '30px',
				}}
			/>
			{note && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '24px',
						marginTop: 'auto',
					}}
				>
					<div
						style={{
							display: 'flex',
							gap: '18px',
							fontFamily: 'IBM Plex Mono',
							fontSize: '21px',
							textTransform: 'uppercase',
							letterSpacing: '0.1em',
							color: CREAM_META,
						}}
					>
						{published && <span>{published}</span>}
						{note.topic && (
							<span style={{ color: ACCENT, fontWeight: 500 }}>
								{note.topic}
							</span>
						)}
					</div>
					<div
						style={{
							fontFamily: 'Elms Sans',
							fontWeight: 500,
							fontSize: longTitle ? '62px' : '78px',
							lineHeight: 1.12,
							letterSpacing: '-0.02em',
							color: CREAM,
							maxWidth: '94%',
						}}
					>
						{title}
					</div>
					{description && (
						<div
							style={{
								fontFamily: 'Fanwood Text',
								fontSize: '36px',
								lineHeight: 1.45,
								color: CREAM_BODY,
								maxWidth: '82%',
							}}
						>
							{description}
						</div>
					)}
				</div>
			)}
		</div>,
		{ ...size, fonts },
	);
}
