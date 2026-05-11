import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
	'askdumbquestions.ai — One question. One answer. Every weekday.';

export default async function OGImage() {
	const fontData = await readFile(
		join(process.cwd(), 'public/fonts/GowunBatang-Regular.ttf'),
	);

	const fonts = [
		{
			name: 'Gowun Batang',
			data: fontData.buffer.slice(
				fontData.byteOffset,
				fontData.byteOffset + fontData.byteLength,
			) as ArrayBuffer,
			style: 'normal' as const,
			weight: 400 as const,
		},
	];

	return new ImageResponse(
		<div
			style={{
				display: 'flex',
				width: '100%',
				height: '100%',
				background: '#2B201A',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '32px',
			}}
		>
			<div
				style={{
					fontFamily: 'Gowun Batang, serif',
					fontSize: '76px',
					color: '#FFFFFF',
					lineHeight: 1,
					letterSpacing: '-1.5px',
				}}
			>
				askdumbquestions.ai
			</div>
			<div
				style={{
					fontSize: '14px',
					color: 'rgba(255,255,255,0.4)',
					letterSpacing: '3px',
					textTransform: 'uppercase',
					fontFamily: 'sans-serif',
				}}
			>
				One question · One answer · Every weekday
			</div>
		</div>,
		{ ...size, fonts },
	);
}
