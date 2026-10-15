// config/env.js
// Imported first in server.js so every module sees process.env at load time,
// no matter which folder the server is started from.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}
