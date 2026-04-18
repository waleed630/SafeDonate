import winston from "winston";
import morgan from "morgan";

// Custom log levels (adds a `status` level for lifecycle/health messages)
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        status: 2,
        info: 3,
        http: 4,
        verbose: 5,
        debug: 6,
        silly: 7,
    },
    colors: {
        error: "red",
        warn: "yellow",
        status: "cyan",
        info: "green",
        http: "magenta",
        verbose: "blue",
        debug: "white",
        silly: "gray",
    },
};

winston.addColors(customLevels.colors);

// Winston Transport
const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf((info) =>
                ` ${info.timestamp} [${info.level}]: ${info.message}`
            )
        ),
    }),
    new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        format: winston.format.json(),
    }),
    new winston.transports.File({
        filename: "logs/combined.log",
        format: winston.format.json(),
    }),
];

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transports,
});

// Morgan stream to Winston
const morganStream = {
    write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()),
};
const morganMiddleware = morgan(
    process.env.NODE_ENV === "production" ? "combined" : "dev",
    { stream: morganStream }
);
export default logger;
export { morganMiddleware }; 



