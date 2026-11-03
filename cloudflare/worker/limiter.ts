import { DurableObject } from "cloudflare:workers"
import { ensureSchema, take, type Verdict } from "./limiter-core"

/** One global instance keeps every visitors' counters in one place (SQLite storage, available on the free plan). */
export class Limiter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ensureSchema(ctx.storage.sql)
  }

  take(key: string, dailyLimit: number): Verdict {
    return take(this.ctx.storage.sql, key, Date.now(), dailyLimit)
  }
}