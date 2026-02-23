import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { initCommentsDb } from "./db/couch.js";

const config = loadConfig();
const db = initCommentsDb(config);
const app = await buildApp(db);

await app.listen({ port: config.port, host: "0.0.0.0" });
