export type StreamConfig = {
  port: number;
  couchUrl: string;
  couchDb: string;
};

export function loadConfig(): StreamConfig {
  return {
    port: Number(process.env.PORT ?? "3002"),
    couchUrl: process.env.COUCHDB_URL ?? "http://admin:password@couchdb:5984",
    couchDb: process.env.COUCHDB_DB ?? "comments"
  };
}
