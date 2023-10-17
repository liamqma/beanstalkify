import { createLogger, format, transports, Logger } from 'winston';

const logger: Logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [
        new transports.Console({
            format: format.simple(),
        }),
    ],
});

export { logger };
