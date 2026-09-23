import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolves to <project root>/data/invoice-counter.json whether running from
// src/ via tsx (dev) or dist/ via node (prod), since both sit two levels
// below the project root.
const COUNTER_FILE = path.join(__dirname, "..", "..", "data", "invoice-counter.json");
const LOCK_FILE = `${COUNTER_FILE}.lock`;

const STARTING_COUNTER = 1001;
const LOCK_RETRY_DELAY_MS = 25;
const LOCK_MAX_RETRIES = 200; // ~5s worst case before giving up

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isEnoent = (err: unknown): boolean =>
  Boolean(err) && (err as NodeJS.ErrnoException).code === "ENOENT";

const isEexist = (err: unknown): boolean =>
  Boolean(err) && (err as NodeJS.ErrnoException).code === "EEXIST";

/**
 * Acquires a cross-process exclusive lock by atomically creating LOCK_FILE
 * (relying on O_EXCL semantics), retrying with a short backoff if another
 * request/worker currently holds it, then always releases it afterwards.
 *
 * This is a simple, dependency-free way to make the counter file safe to
 * read-modify-write from multiple `cluster` worker processes on a single
 * server. It is NOT sufficient across multiple servers/hosts — if you scale
 * horizontally, replace this with a DB sequence or a Redis INCR instead.
 */
async function withCounterLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(path.dirname(LOCK_FILE), { recursive: true });

  let attempt = 0;
  for (;;) {
    try {
      const handle = await fs.open(LOCK_FILE, "wx");
      await handle.close();
      break;
    } catch (err) {
      if (!isEexist(err)) throw err;
      attempt += 1;
      if (attempt > LOCK_MAX_RETRIES) {
        throw new Error(
          "Timed out waiting for the invoice counter lock. If the process crashed " +
            `while holding it, delete ${LOCK_FILE} manually.`,
        );
      }
      await sleep(LOCK_RETRY_DELAY_MS);
    }
  }

  try {
    return await fn();
  } finally {
    await fs.unlink(LOCK_FILE).catch(() => {
      // Lock file already gone; nothing to clean up.
    });
  }
}

async function readCounter(): Promise<number> {
  try {
    const raw = await fs.readFile(COUNTER_FILE, "utf-8");
    const parsed = JSON.parse(raw) as { counter?: unknown };
    return typeof parsed.counter === "number" && Number.isFinite(parsed.counter)
      ? parsed.counter
      : STARTING_COUNTER;
  } catch (err) {
    if (isEnoent(err)) return STARTING_COUNTER;
    // Corrupt or unreadable counter file: fail loudly rather than silently
    // resetting to 1001 and risking a duplicate invoice number.
    throw new Error(
      `Could not read invoice counter file at ${COUNTER_FILE}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

async function writeCounter(counter: number): Promise<void> {
  await fs.mkdir(path.dirname(COUNTER_FILE), { recursive: true });
  await fs.writeFile(COUNTER_FILE, JSON.stringify({ counter }), "utf-8");
}

/**
 * Returns the next sequential invoice number, e.g. "INV-2026-1001".
 *
 * The counter is persisted to disk under a lock so it survives process
 * restarts and is shared correctly across `cluster` worker processes.
 * Note: the numeric part is a single ever-increasing sequence and is not
 * reset per calendar year (matching the original behaviour) — only the
 * year prefix reflects `date`.
 */
export async function nextInvoiceNumber(date: Date): Promise<string> {
  return withCounterLock(async () => {
    const current = await readCounter();
    await writeCounter(current + 1);
    return `INV-${date.getFullYear()}-${current}`;
  });
}
