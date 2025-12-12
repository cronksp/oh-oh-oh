import pino from "pino";
import { existsSync, mkdirSync } from "fs";

// Ensure log directory exists
if (!existsSync("./log")) {
    mkdirSync("./log", { recursive: true });
}

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: {
        env: process.env.NODE_ENV,
    },
}, pino.destination({ dest: "./log/app.log", sync: true }));

// export const logger = {
//     info: (obj: any, msg?: string) => console.log(msg, obj),
//     error: (obj: any, msg?: string) => console.error(msg, obj),
//     warn: (obj: any, msg?: string) => console.warn(msg, obj),
//     debug: (obj: any, msg?: string) => console.debug(msg, obj),
// };
