import winston from "winston";

// Add `status` as an intermediate log level for service lifecycle messages.
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

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: "identity-service" },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: "error.log", level: "error" }),
    ],
});

export default logger;
