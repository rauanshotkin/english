import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export const VISITOR_COOKIE = "reader_visitor";
export const VISITOR_TTL_SECONDS = 365 * 24 * 60 * 60;

const validIdentifier =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Stores a hash of the random consented identifier, never IPs or user agents. */
export class ReaderStore {
  readonly database: DatabaseSync;

  constructor(filename: string) {
    this.database = new DatabaseSync(filename);
    this.database.exec(
      "PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;",
    );
    this.database.exec(`CREATE TABLE IF NOT EXISTS readers (
      identifier_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    ); CREATE INDEX IF NOT EXISTS readers_expiry ON readers(expires_at);`);
  }

  private prune(now: number) {
    this.database.prepare("DELETE FROM readers WHERE expires_at <= ?").run(now);
  }

  count(now = Date.now()): number {
    this.prune(now);
    const row = this.database
      .prepare("SELECT COUNT(*) AS total FROM readers")
      .get() as { total: number };
    return Number(row.total);
  }

  visit(identifier?: string, now = Date.now()) {
    this.prune(now);
    const visitorId =
      identifier && validIdentifier.test(identifier)
        ? identifier
        : randomUUID();
    const hash = createHash("sha256").update(visitorId).digest("hex");
    const existing = this.database
      .prepare("SELECT identifier_hash FROM readers WHERE identifier_hash = ?")
      .get(hash);
    this.database
      .prepare(
        "INSERT INTO readers (identifier_hash, expires_at) VALUES (?, ?) ON CONFLICT(identifier_hash) DO UPDATE SET expires_at = excluded.expires_at",
      )
      .run(hash, now + VISITOR_TTL_SECONDS * 1000);
    return { visitorId, counted: !existing, uniqueReaders: this.count(now) };
  }

  forget(identifier?: string, now = Date.now()) {
    let deleted = false;
    if (identifier && validIdentifier.test(identifier)) {
      const hash = createHash("sha256").update(identifier).digest("hex");
      deleted =
        Number(
          this.database
            .prepare("DELETE FROM readers WHERE identifier_hash = ?")
            .run(hash).changes,
        ) > 0;
    }
    return { deleted, uniqueReaders: this.count(now) };
  }

  close() {
    this.database.close();
  }
}

export function readVisitorCookie(header?: string): string | undefined {
  if (!header) return undefined;
  const entry = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`));
  if (!entry) return undefined;
  try {
    const value = decodeURIComponent(entry.slice(VISITOR_COOKIE.length + 1));
    return validIdentifier.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
