import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";

type Identity = {
  user: string;
  email: string;
  role: "admin" | "user";
};

const app = Fastify({ logger: true });
await app.register(cookie);

const port = Number(process.env.PORT ?? "3010");
const cookieName = process.env.AUTH_COOKIE_NAME ?? "comment0r_auth";

function encodeIdentity(identity: Identity): string {
  return Buffer.from(JSON.stringify(identity), "utf8").toString("base64url");
}

function decodeIdentity(value: string): Identity | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Identity;
    if (!parsed.user || !parsed.email || (parsed.role !== "admin" && parsed.role !== "user")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function identityFromRequest(request: FastifyRequest): Identity | null {
  const cookieValue = (request as { cookies?: Record<string, string> }).cookies?.[cookieName];
  if (typeof cookieValue === "string") {
    return decodeIdentity(cookieValue);
  }

  const headerUser = request.headers["x-dev-user"];
  const headerEmail = request.headers["x-dev-email"];
  const headerRole = request.headers["x-dev-role"];

  if (
    typeof headerUser === "string" &&
    typeof headerEmail === "string" &&
    (headerRole === "admin" || headerRole === "user")
  ) {
    return {
      user: headerUser,
      email: headerEmail,
      role: headerRole
    };
  }

  return null;
}

function applyIdentityHeaders(reply: FastifyReply, identity: Identity) {
  reply.header("X-Auth-Request-User", identity.user);
  reply.header("X-Auth-Request-Email", identity.email);
  reply.header("X-Auth-Request-Role", identity.role);
}

app.get("/health", async () => ({ ok: true }));

app.get("/auth/login", async (request, reply) => {
  const query = request.query as Record<string, string | undefined>;
  const user = query.user?.trim() || "dev-user";
  const role = query.role === "admin" ? "admin" : "user";
  const email = query.email?.trim() || `${user}@local.dev`;
  const redirectTo = query.rd?.trim() || "/";

  const identity: Identity = { user, email, role };
  (reply as unknown as { setCookie: (name: string, value: string, opts: Record<string, unknown>) => void }).setCookie(
    cookieName,
    encodeIdentity(identity),
    {
    path: "/",
    httpOnly: false,
    sameSite: "lax"
    }
  );

  return reply.redirect(redirectTo);
});

app.get("/auth/logout", async (request, reply) => {
  const query = request.query as Record<string, string | undefined>;
  const redirectTo = query.rd?.trim() || "/";
  (reply as unknown as { clearCookie: (name: string, opts: Record<string, unknown>) => void }).clearCookie(
    cookieName,
    { path: "/" }
  );
  return reply.redirect(redirectTo);
});

app.get("/auth/verify/user", async (request, reply) => {
  const identity = identityFromRequest(request);
  if (!identity) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  applyIdentityHeaders(reply, identity);
  return reply.code(202).send({ ok: true });
});

app.get("/auth/verify/admin", async (request, reply) => {
  const identity = identityFromRequest(request);
  if (!identity) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  if (identity.role !== "admin") {
    return reply.code(403).send({ error: "forbidden" });
  }
  applyIdentityHeaders(reply, identity);
  return reply.code(202).send({ ok: true });
});

await app.listen({ port, host: "0.0.0.0" });
