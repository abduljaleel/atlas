import { createClient } from "@/lib/supabase/client";
import {
  models as seedModels,
  policies as seedPolicies,
  apiKeys as seedApiKeys,
  type Model,
  type ModelProvider,
  type Policy,
  type ApiKey,
  type RequestLog,
  type Alert,
} from "./models";

// ─── Context ─────────────────────────────────────────────

export async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  return { supabase, userId: user.id, orgId: profile!.org_id as string };
}

// ─── DB row types (snake_case) ───────────────────────────

type ModelMetadata = {
  display_name?: string;
  avg_latency_ms?: number;
  cost_per_1k_tokens?: number;
};

type ModelConfigRow = {
  id: string;
  provider: string;
  model_name: string;
  endpoint_url: string | null;
  active: boolean;
  metadata: ModelMetadata | null;
  created_at: string;
};

type RoutingPolicyRow = {
  id: string;
  name: string;
  conditions: Policy["conditions"] | Record<string, never> | null;
  target_model: string;
  fallback_model: string | null;
  cost_ceiling_cents: number | null;
  latency_max_ms: number | null;
  priority: number;
  active: boolean;
  created_at: string;
};

type ApiKeyRow = {
  id: string;
  name: string;
  key_hash: string;
  prefix: string;
  permissions: unknown;
  rate_limit: number | null;
  active: boolean;
  created_by: string | null;
  last_used_at: string | null;
  created_at: string;
};

type UsageLogRow = {
  id: string;
  api_key_id: string | null;
  policy_id: string | null;
  model_used: string;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  cost_cents: number | null;
  status: string;
  created_at: string;
  routing_policies: { name: string } | null;
};

type AlertRow = {
  id: string;
  alert_type: "cost" | "latency" | "error_rate" | "usage";
  threshold: number | string;
  current_value: number | string | null;
  triggered_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
};

// ─── Mappers (snake_case → existing UI camelCase types) ──

function toProvider(value: string): ModelProvider {
  return value === "OpenAI" || value === "Anthropic" || value === "Google"
    ? value
    : "Custom";
}

function mapModel(row: ModelConfigRow): Model {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    name: meta.display_name ?? row.model_name,
    provider: toProvider(row.provider),
    modelId: row.model_name,
    endpoint: row.endpoint_url ?? "",
    status: row.active ? "active" : "inactive",
    avgLatency: meta.avg_latency_ms ?? 0,
    costPer1kTokens: meta.cost_per_1k_tokens ?? 0,
  };
}

function mapPolicy(row: RoutingPolicyRow): Policy {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    status: row.active ? "active" : "inactive",
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    targetModel: row.target_model,
    fallbackModel: row.fallback_model ?? "",
    costCeiling:
      row.cost_ceiling_cents != null ? row.cost_ceiling_cents / 100 : null,
    latencyMax: row.latency_max_ms,
  };
}

function mapApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    createdAt: row.created_at.slice(0, 10),
    lastUsed: row.last_used_at ? row.last_used_at.slice(0, 10) : null,
    status: row.active ? "active" : "revoked",
    rateLimit: row.rate_limit ?? 0,
  };
}

const REDACTED_CONTENT = "[content not retained — metadata-only logging]";

function mapUsageLog(row: UsageLogRow): RequestLog {
  const tokensIn = row.tokens_in ?? 0;
  const tokensOut = row.tokens_out ?? 0;
  const status: RequestLog["status"] =
    row.status === "success" ? "success" : "error";
  const requestBody = JSON.stringify(
    {
      model: row.model_used,
      messages: [{ role: "user", content: REDACTED_CONTENT }],
      max_tokens: tokensOut,
    },
    null,
    2
  );
  const responseBody =
    status === "error"
      ? JSON.stringify(
          {
            error: {
              message:
                row.status === "timeout"
                  ? "Upstream request timed out"
                  : "Upstream provider error",
              type: `${row.status}_error`,
              code: row.status === "timeout" ? 504 : 502,
            },
          },
          null,
          2
        )
      : JSON.stringify(
          {
            id: `req_${row.id.slice(0, 8)}`,
            model: row.model_used,
            usage: { prompt_tokens: tokensIn, completion_tokens: tokensOut },
            choices: [
              { message: { role: "assistant", content: REDACTED_CONTENT } },
            ],
          },
          null,
          2
        );
  return {
    id: row.id,
    timestamp: row.created_at,
    model: row.model_used,
    tokensIn,
    tokensOut,
    latency: row.latency_ms ?? 0,
    cost: (row.cost_cents ?? 0) / 100,
    status,
    policyMatched: row.routing_policies?.name ?? null,
    requestBody,
    responseBody,
  };
}

function mapAlert(row: AlertRow): Alert {
  const threshold = Number(row.threshold);
  const current = row.current_value != null ? Number(row.current_value) : null;
  let severity: Alert["severity"];
  let message: string;
  switch (row.alert_type) {
    case "error_rate":
      severity = "error";
      message = `Error rate exceeded ${threshold}% threshold${
        current != null ? ` (current: ${current}%)` : ""
      }`;
      break;
    case "latency":
      severity = "warning";
      message = `p95 latency above ${threshold}ms${
        current != null ? ` (current: ${current}ms)` : ""
      }`;
      break;
    case "cost":
      severity = "warning";
      message =
        current != null
          ? `Daily cost approaching budget limit ($${current} / $${threshold})`
          : `Daily cost approaching budget limit ($${threshold})`;
      break;
    default:
      severity = "info";
      message =
        current != null
          ? `Usage at ${current}% of plan limit (alert at ${threshold}%)`
          : `Usage threshold alert (${threshold}%)`;
      break;
  }
  return {
    id: row.id,
    severity,
    message,
    timestamp: row.triggered_at ?? row.created_at,
  };
}

// ─── model_configs ───────────────────────────────────────

const MODEL_COLUMNS =
  "id, provider, model_name, endpoint_url, active, metadata, created_at";

export async function listModels(): Promise<Model[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("model_configs")
    .select(MODEL_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ModelConfigRow[]).map(mapModel);
}

export async function createModel(input: {
  name: string;
  provider: ModelProvider;
  modelId: string;
  endpoint: string;
}): Promise<Model> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("model_configs")
    .insert({
      org_id: orgId,
      provider: input.provider,
      model_name: input.modelId,
      endpoint_url: input.endpoint,
      active: true,
      metadata: {
        display_name: input.name,
        avg_latency_ms: 0,
        cost_per_1k_tokens: 0,
      },
    })
    .select(MODEL_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapModel(data as ModelConfigRow);
}

export async function updateModel(
  id: string,
  patch: Partial<
    Pick<
      Model,
      | "name"
      | "provider"
      | "modelId"
      | "endpoint"
      | "status"
      | "avgLatency"
      | "costPer1kTokens"
    >
  >
): Promise<Model> {
  const { supabase } = await getCtx();
  const update: Record<string, unknown> = {};
  if (patch.provider !== undefined) update.provider = patch.provider;
  if (patch.modelId !== undefined) update.model_name = patch.modelId;
  if (patch.endpoint !== undefined) update.endpoint_url = patch.endpoint;
  if (patch.status !== undefined) update.active = patch.status === "active";
  if (
    patch.name !== undefined ||
    patch.avgLatency !== undefined ||
    patch.costPer1kTokens !== undefined
  ) {
    const { data: existing, error: readError } = await supabase
      .from("model_configs")
      .select("metadata")
      .eq("id", id)
      .single();
    if (readError) throw new Error(readError.message);
    const metadata: ModelMetadata = {
      ...(((existing as { metadata: ModelMetadata | null } | null)?.metadata) ??
        {}),
    };
    if (patch.name !== undefined) metadata.display_name = patch.name;
    if (patch.avgLatency !== undefined)
      metadata.avg_latency_ms = patch.avgLatency;
    if (patch.costPer1kTokens !== undefined)
      metadata.cost_per_1k_tokens = patch.costPer1kTokens;
    update.metadata = metadata;
  }
  const { data, error } = await supabase
    .from("model_configs")
    .update(update)
    .eq("id", id)
    .select(MODEL_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapModel(data as ModelConfigRow);
}

export async function deleteModel(id: string): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase.from("model_configs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── routing_policies ────────────────────────────────────

const POLICY_COLUMNS =
  "id, name, conditions, target_model, fallback_model, cost_ceiling_cents, latency_max_ms, priority, active, created_at";

export async function listPolicies(): Promise<Policy[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("routing_policies")
    .select(POLICY_COLUMNS)
    .eq("org_id", orgId)
    .order("priority", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RoutingPolicyRow[]).map(mapPolicy);
}

export async function createPolicy(
  input: Omit<Policy, "id" | "status"> & { status?: Policy["status"] }
): Promise<Policy> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("routing_policies")
    .insert({
      org_id: orgId,
      name: input.name,
      conditions: input.conditions,
      target_model: input.targetModel,
      fallback_model: input.fallbackModel || null,
      cost_ceiling_cents:
        input.costCeiling != null ? Math.round(input.costCeiling * 100) : null,
      latency_max_ms: input.latencyMax,
      priority: input.priority,
      active: (input.status ?? "active") === "active",
    })
    .select(POLICY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapPolicy(data as RoutingPolicyRow);
}

export async function updatePolicy(
  id: string,
  patch: Partial<Omit<Policy, "id">>
): Promise<Policy> {
  const { supabase } = await getCtx();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.conditions !== undefined) update.conditions = patch.conditions;
  if (patch.targetModel !== undefined) update.target_model = patch.targetModel;
  if (patch.fallbackModel !== undefined)
    update.fallback_model = patch.fallbackModel || null;
  if (patch.costCeiling !== undefined)
    update.cost_ceiling_cents =
      patch.costCeiling != null ? Math.round(patch.costCeiling * 100) : null;
  if (patch.latencyMax !== undefined) update.latency_max_ms = patch.latencyMax;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.status !== undefined) update.active = patch.status === "active";
  const { data, error } = await supabase
    .from("routing_policies")
    .update(update)
    .eq("id", id)
    .select(POLICY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapPolicy(data as RoutingPolicyRow);
}

export async function deletePolicy(id: string): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase
    .from("routing_policies")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── api_keys ────────────────────────────────────────────

const API_KEY_COLUMNS =
  "id, name, key_hash, prefix, permissions, rate_limit, active, created_by, last_used_at, created_at";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("api_keys")
    .select(API_KEY_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ApiKeyRow[]).map(mapApiKey);
}

/**
 * Generates the secret client-side, stores only prefix + SHA-256 hex hash.
 * The full key is returned exactly once and never persisted.
 */
export async function createApiKey(input: {
  name: string;
  rateLimit: number;
}): Promise<{ apiKey: ApiKey; fullKey: string }> {
  const { supabase, orgId, userId } = await getCtx();
  const slug =
    input.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 16) || "key";
  const random = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  const fullKey = `sk-nr-${slug}-${random.slice(0, 32)}`;
  const keyHash = await sha256Hex(fullKey);
  const prefix = `sk-nr-****${fullKey.slice(-4)}`;
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: orgId,
      name: input.name,
      key_hash: keyHash,
      prefix,
      permissions: ["routes:invoke"],
      rate_limit: input.rateLimit,
      active: true,
      created_by: userId,
    })
    .select(API_KEY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { apiKey: mapApiKey(data as ApiKeyRow), fullKey };
}

export async function updateApiKey(
  id: string,
  patch: Partial<Pick<ApiKey, "name" | "status" | "rateLimit">>
): Promise<ApiKey> {
  const { supabase } = await getCtx();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.rateLimit !== undefined) update.rate_limit = patch.rateLimit;
  if (patch.status !== undefined) update.active = patch.status === "active";
  const { data, error } = await supabase
    .from("api_keys")
    .update(update)
    .eq("id", id)
    .select(API_KEY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapApiKey(data as ApiKeyRow);
}

export async function deleteApiKey(id: string): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── usage_logs (append-only: list + bulk insert) ────────

const USAGE_LOG_COLUMNS =
  "id, api_key_id, policy_id, model_used, tokens_in, tokens_out, latency_ms, cost_cents, status, created_at, routing_policies(name)";

export async function listUsageLogs(limit = 500): Promise<RequestLog[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("usage_logs")
    .select(USAGE_LOG_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as UsageLogRow[]).map(mapUsageLog);
}

type UsageLogInsert = {
  api_key_id: string | null;
  policy_id: string | null;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_cents: number;
  status: "success" | "error" | "timeout" | "fallback";
  created_at?: string;
};

export async function createUsageLogs(rows: UsageLogInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { supabase, orgId } = await getCtx();
  const payload = rows.map((row) => ({ ...row, org_id: orgId }));
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await supabase
      .from("usage_logs")
      .insert(payload.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
}

// ─── alerts ──────────────────────────────────────────────

const ALERT_COLUMNS =
  "id, alert_type, threshold, current_value, triggered_at, acknowledged_by, created_at";

export async function listAlerts(): Promise<Alert[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("org_id", orgId)
    .order("triggered_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AlertRow[]).map(mapAlert);
}

export async function createAlert(input: {
  alertType: AlertRow["alert_type"];
  threshold: number;
  currentValue?: number | null;
  triggeredAt?: string | null;
}): Promise<Alert> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      org_id: orgId,
      alert_type: input.alertType,
      threshold: input.threshold,
      current_value: input.currentValue ?? null,
      triggered_at: input.triggeredAt ?? new Date().toISOString(),
    })
    .select(ALERT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapAlert(data as AlertRow);
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const { supabase, userId } = await getCtx();
  const { error } = await supabase
    .from("alerts")
    .update({ acknowledged_by: userId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAlert(id: string): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Demo seeding ────────────────────────────────────────

/**
 * Inserts the demo content from the seed arrays with correct org/user
 * ownership and FK chains: model_configs, routing_policies and api_keys
 * first, then usage_logs (FK → api_keys/routing_policies) and alerts.
 * Dates are computed relative to "now".
 */
export async function seedDemoData(): Promise<void> {
  const { supabase, orgId, userId } = await getCtx();
  const now = Date.now();
  const daysAgo = (days: number) =>
    new Date(now - days * 86_400_000).toISOString();
  const minutesAgo = (minutes: number) =>
    new Date(now - minutes * 60_000).toISOString();

  // 1) Model configs
  const { error: modelError } = await supabase.from("model_configs").insert(
    seedModels.map((m) => ({
      org_id: orgId,
      provider: m.provider,
      model_name: m.modelId,
      endpoint_url: m.endpoint,
      active: m.status === "active",
      metadata: {
        display_name: m.name,
        avg_latency_ms: m.avgLatency,
        cost_per_1k_tokens: m.costPer1kTokens,
      },
    }))
  );
  if (modelError) throw new Error(modelError.message);

  // 2) Routing policies (capture generated ids for usage_logs FKs)
  const { data: policyRows, error: policyError } = await supabase
    .from("routing_policies")
    .insert(
      seedPolicies.map((p) => ({
        org_id: orgId,
        name: p.name,
        conditions: p.conditions,
        target_model: p.targetModel,
        fallback_model: p.fallbackModel,
        cost_ceiling_cents:
          p.costCeiling != null ? Math.round(p.costCeiling * 100) : null,
        latency_max_ms: p.latencyMax,
        priority: p.priority,
        active: p.status === "active",
      }))
    )
    .select("id, name");
  if (policyError) throw new Error(policyError.message);

  // 3) API keys (capture generated ids for usage_logs FKs)
  const keyCreatedDaysAgo = [148, 130, 80, 60, 254];
  const keyLastUsedDaysAgo: (number | null)[] = [0, 1, 2, 0, 86];
  const keyInserts = [];
  for (let i = 0; i < seedApiKeys.length; i++) {
    const k = seedApiKeys[i];
    keyInserts.push({
      org_id: orgId,
      name: k.name,
      key_hash: await sha256Hex(`demo-${crypto.randomUUID()}`),
      prefix: k.prefix,
      permissions: ["routes:invoke"],
      rate_limit: k.rateLimit,
      active: k.status === "active",
      created_by: userId,
      created_at: daysAgo(keyCreatedDaysAgo[i] ?? 30),
      last_used_at:
        k.lastUsed != null && keyLastUsedDaysAgo[i] != null
          ? daysAgo(keyLastUsedDaysAgo[i] as number)
          : null,
    });
  }
  const { data: keyRows, error: keyError } = await supabase
    .from("api_keys")
    .insert(keyInserts)
    .select("id, name, active");
  if (keyError) throw new Error(keyError.message);

  // 4) Usage logs spread over the last 24h (volume shaped by hour of day)
  const policyIdByName = new Map(
    ((policyRows ?? []) as { id: string; name: string }[]).map(
      (p) => [p.name, p.id] as const
    )
  );
  const activeKeyIds = ((keyRows ?? []) as {
    id: string;
    name: string;
    active: boolean;
  }[])
    .filter((k) => k.active)
    .map((k) => k.id);
  const activeModels = seedModels.filter((m) => m.status === "active");
  const policyCycle: (string | null)[] = [
    policyIdByName.get("Code Generation → GPT-4o") ?? null,
    policyIdByName.get("Analysis → Claude Sonnet") ?? null,
    policyIdByName.get("Cost Guard — Route Cheap") ?? null,
    policyIdByName.get("Latency Guard — Fast Path") ?? null,
    null,
  ];

  const logInserts: (UsageLogInsert & { org_id: string })[] = [];
  let g = 0;
  for (let hoursBack = 23; hoursBack >= 0; hoursBack--) {
    const hourAnchor = now - hoursBack * 3_600_000;
    const hourOfDay = new Date(hourAnchor).getHours();
    const perHour = Math.max(
      3,
      Math.round(
        (80 +
          Math.sin(hourOfDay / 3.8) * 60 +
          (hourOfDay > 8 && hourOfDay < 20 ? 120 : 0) +
          ((hourOfDay * 7) % 40)) /
          10
      )
    );
    const step = Math.floor(3_600_000 / perHour);
    for (let j = 0; j < perHour; j++) {
      const model = activeModels[g % activeModels.length];
      const isError = g % 17 === 0;
      const tokensIn = 50 + ((g * 37) % 2000);
      const tokensOut = 20 + ((g * 53) % 3000);
      logInserts.push({
        org_id: orgId,
        api_key_id: activeKeyIds.length
          ? activeKeyIds[g % activeKeyIds.length]
          : null,
        policy_id: policyCycle[g % policyCycle.length],
        model_used: model.name,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: 80 + ((g * 41) % 900),
        cost_cents: Math.max(
          1,
          Math.round(
            ((tokensIn + tokensOut) / 1000) * model.costPer1kTokens * 100
          )
        ),
        status: isError ? "error" : "success",
        created_at: new Date(hourAnchor - j * step).toISOString(),
      });
      g++;
    }
  }
  for (let i = 0; i < logInserts.length; i += 500) {
    const { error: logError } = await supabase
      .from("usage_logs")
      .insert(logInserts.slice(i, i + 500));
    if (logError) throw new Error(logError.message);
  }

  // 5) Alerts
  const { error: alertError } = await supabase.from("alerts").insert([
    {
      org_id: orgId,
      alert_type: "error_rate",
      threshold: 5,
      current_value: 6.2,
      triggered_at: minutesAgo(18),
    },
    {
      org_id: orgId,
      alert_type: "latency",
      threshold: 1000,
      current_value: 1184,
      triggered_at: minutesAgo(45),
    },
    {
      org_id: orgId,
      alert_type: "cost",
      threshold: 200,
      current_value: 180,
      triggered_at: minutesAgo(95),
    },
    {
      org_id: orgId,
      alert_type: "usage",
      threshold: 80,
      current_value: 62,
      triggered_at: minutesAgo(180),
    },
  ]);
  if (alertError) throw new Error(alertError.message);
}
