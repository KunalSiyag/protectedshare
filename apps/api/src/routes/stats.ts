import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { jsonError } from "../lib/env";
import { readUsageStats } from "../lib/usage";

export const statsRoutes = new Hono<AppEnv>();

/**
 * GET /api/stats: how many links were created in the last 30 days, per kind. Counts only,
 * no ids. Cacheable for 10 minutes (the API's default is no-store).
 */
statsRoutes.get("/api/stats", async (c) => {
  try {
    const stats = await readUsageStats(c.env.DB);
    return c.json(stats, 200, { "Cache-Control": "public, max-age=600" });
  } catch (error) {
    console.error("Failed to read usage stats:", error);
    return jsonError("Stats are unavailable right now.", "STATS_UNAVAILABLE", 503);
  }
});
