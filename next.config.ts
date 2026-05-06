import type { NextConfig } from 'next';

// SHA-256 hash of the inline FOUC-prevention theme script in src/app/layout.tsx.
// Recompute if the script content changes: node -e "const c=require('crypto'),s='<script>';console.log('sha256-'+c.createHash('sha256').update(s).digest('base64'))"
const THEME_SCRIPT_HASH = 'sha256-BxfgR2e6STGufbtFBuzD63RXZme5PlWnBVYb3EbCF5E=';

const securityHeaders = [
	{
		key: 'Content-Security-Policy',
		value: [
			`default-src 'self'`,
			`script-src 'self' '${THEME_SCRIPT_HASH}'`,
			`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
			`font-src 'self' https://fonts.gstatic.com`,
			`img-src 'self' data:`,
			`connect-src 'self'`,
			`frame-ancestors 'none'`,
		].join('; '),
	},
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
	async headers() {
		if (process.env.NODE_ENV === 'development') return [];
		return [{ source: '/(.*)', headers: securityHeaders }];
	},
};

export default nextConfig;
