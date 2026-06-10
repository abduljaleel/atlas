"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listUsageLogs,
  listAlerts,
  listModels,
  seedDemoData,
} from "@/lib/data/api";
import type { Alert, Model, RequestLog } from "@/lib/data/models";
import {
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Info,
  Database,
} from "lucide-react";

export default function DashboardPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [alertList, setAlertList] = useState<Alert[]>([]);
  const [modelList, setModelList] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [logsData, alertsData, modelsData] = await Promise.all([
        listUsageLogs(1000),
        listAlerts(),
        listModels(),
      ]);
      setLogs(logsData);
      setAlertList(alertsData);
      setModelList(modelsData);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      await seedDemoData();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  }

  const logs24h = useMemo(() => {
    const cutoff = Date.now() - 86_400_000;
    return logs.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }, [logs]);

  // Prior 24h window (24-48h ago) for period-over-period deltas
  const logsPrev24h = useMemo(() => {
    const now = Date.now();
    const start = now - 2 * 86_400_000;
    const end = now - 86_400_000;
    return logs.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      return t >= start && t < end;
    });
  }, [logs]);

  const hourlyUsage = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      requests: 0,
    }));
    for (const log of logs24h) {
      const h = new Date(log.timestamp).getHours();
      buckets[h].requests += 1;
    }
    return buckets;
  }, [logs24h]);

  const modelBreakdown = useMemo(() => {
    const byModel = new Map<string, number>();
    for (const log of logs24h) {
      byModel.set(log.model, (byModel.get(log.model) ?? 0) + 1);
    }
    return Array.from(byModel.entries()).map(([model, requests]) => ({
      model,
      requests,
    }));
  }, [logs24h]);

  const totalRequests = logs24h.length;
  const avgLatency = logs24h.length
    ? Math.round(logs24h.reduce((sum, l) => sum + l.latency, 0) / logs24h.length)
    : 0;
  const totalCost = logs24h.reduce((sum, l) => sum + l.cost, 0);
  const errorRate = logs24h.length
    ? parseFloat(
        (
          (logs24h.filter((l) => l.status === "error").length /
            logs24h.length) *
          100
        ).toFixed(1)
      )
    : 0;

  // Real deltas vs the prior 24h window; null when there is no prior data
  const prevTotalRequests = logsPrev24h.length;
  const prevAvgLatency = logsPrev24h.length
    ? Math.round(
        logsPrev24h.reduce((sum, l) => sum + l.latency, 0) / logsPrev24h.length
      )
    : 0;
  const prevTotalCost = logsPrev24h.reduce((sum, l) => sum + l.cost, 0);
  const prevErrorRate = logsPrev24h.length
    ? (logsPrev24h.filter((l) => l.status === "error").length /
        logsPrev24h.length) *
      100
    : 0;

  const requestsDelta =
    prevTotalRequests > 0
      ? `${totalRequests >= prevTotalRequests ? "+" : ""}${(
          ((totalRequests - prevTotalRequests) / prevTotalRequests) *
          100
        ).toFixed(1)}% vs yesterday`
      : null;
  const latencyDelta =
    prevTotalRequests > 0
      ? `${avgLatency >= prevAvgLatency ? "+" : ""}${
          avgLatency - prevAvgLatency
        }ms vs yesterday`
      : null;
  const costDelta =
    prevTotalRequests > 0
      ? `${totalCost >= prevTotalCost ? "+" : "-"}$${Math.abs(
          totalCost - prevTotalCost
        ).toFixed(2)} vs yesterday`
      : null;
  const errorRateDelta =
    prevTotalRequests > 0
      ? `${errorRate >= prevErrorRate ? "+" : ""}${(
          errorRate - prevErrorRate
        ).toFixed(1)}% vs yesterday`
      : null;

  const isEmpty =
    !loading && modelList.length === 0 && logs.length === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Operations overview — last 24 hours
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Operations overview — last 24 hours
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Database className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No routing data yet</p>
              <p className="text-sm text-muted-foreground">
                Connect gateway traffic to your org, or load demo data to
                explore Atlas.
              </p>
            </div>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? "Loading demo data..." : "Load demo data"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
        <>
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests (24h)"
          value={totalRequests.toLocaleString()}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          delta={requestsDelta}
        />
        <MetricCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          delta={latencyDelta}
        />
        <MetricCard
          title="Total Cost (24h)"
          value={`$${totalCost.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          delta={costDelta}
        />
        <MetricCard
          title="Error Rate"
          value={`${errorRate}%`}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          delta={errorRateDelta}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Volume Sparkline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Request Volume (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[3px] h-32">
              {hourlyUsage.map((h) => {
                const max =
                  Math.max(...hourlyUsage.map((u) => u.requests)) || 1;
                const height = (h.requests / max) * 100;
                return (
                  <div
                    key={h.hour}
                    className="group relative flex-1 flex flex-col items-center"
                  >
                    <div className="absolute -top-6 hidden group-hover:block text-xs bg-popover border rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm z-10">
                      {h.hour}: {h.requests}
                    </div>
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Model Usage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No requests routed in the last 24 hours.
                </p>
              )}
              {modelBreakdown
                .sort((a, b) => b.requests - a.requests)
                .map((m) => {
                  const max =
                    Math.max(...modelBreakdown.map((u) => u.requests)) || 1;
                  const pct = (m.requests / max) * 100;
                  return (
                    <div key={m.model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.model}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {m.requests.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertList.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active alerts.
              </p>
            )}
            {alertList.map((alert) => {
              const Icon =
                alert.severity === "error"
                  ? AlertCircle
                  : alert.severity === "warning"
                    ? AlertTriangle
                    : Info;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Icon
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      alert.severity === "error"
                        ? "text-destructive"
                        : alert.severity === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alert.severity === "error"
                        ? "destructive"
                        : alert.severity === "warning"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  delta,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  delta: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {delta && (
          <p className="text-xs text-muted-foreground mt-1">{delta}</p>
        )}
      </CardContent>
    </Card>
  );
}
