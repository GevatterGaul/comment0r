export type ApiConfig = {
  port: number;
  couchUrl: string;
  couchDb: string;
};

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.PORT ?? "3001"),
    couchUrl: process.env.COUCHDB_URL ?? "http://admin:password@couchdb:5984",
    couchDb: process.env.COUCHDB_DB ?? "comments"
  };
}
