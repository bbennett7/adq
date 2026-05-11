import type { LevelWithSilent } from 'pino';
import pino from 'pino';

const VALID_LEVELS: ReadonlyArray<LevelWithSilent> = [
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'silent',
];

function resolveLevel(): LevelWithSilent {
	const raw = process.env.LOG_LEVEL;
	if (raw && (VALID_LEVELS as ReadonlyArray<string>).includes(raw)) {
		return raw as LevelWithSilent;
	}
	return 'info';
}

export const logger = pino({
	level: resolveLevel(),
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
