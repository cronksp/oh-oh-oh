import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: {
        env: process.env.NODE_ENV,
    },
});

// export const logger = {
//     info: (obj: any, msg?: string) => console.log(msg, obj),
//     error: (obj: any, msg?: string) => console.error(msg, obj),
//     warn: (obj: any, msg?: string) => console.warn(msg, obj),
//     debug: (obj: any, msg?: string) => console.debug(msg, obj),
// };
