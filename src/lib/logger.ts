import type { LevelWithSilent } from 'pino';
import pino from 'pino';

export const logger = pino({
	level: (process.env.LOG_LEVEL ?? 'info') as LevelWithSilent,
	serializers: {
		err: pino.stdSerializers.err,
		cause: pino.stdSerializers.err,
	},
	redact: {
		paths: [
			'*.password',
			'*.secret',
			'*.token',
			'*.key',
			'*.authorization',
			'*.connectionString',
		],
		censor: '[REDACTED]',
	},
	...(process.env.NODE_ENV === 'development' && {
		transport: {
			target: 'pino-pretty',
			options: { colorize: true, ignore: 'pid,hostname' },
		},
	}),
});
