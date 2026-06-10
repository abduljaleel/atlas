"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModelUsage, RequestLog } from "@/lib/data/models";
import { listUsageLogs } from "@/lib/data/api";

type TimeRange = "24h" | "7d" | "30d";

const rangeMs: Record<TimeRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.floor(p * (sortedValues.length - 1))
  );
  return sortedValues[index];
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listUsageLogs(1000);
        if (!cancelled) setLogs(data);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to load analytics data"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rangeLogs = useMemo(() => {
    const cutoff = Date.now() - rangeMs[timeRange];
    return logs.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }, [logs, timeRange]);

  const data: ModelUsage[] = useMemo(() => {
    const byModel = new Map<string, RequestLog[]>();
    for (const log of rangeLogs) {
      const list = byModel.get(log.model) ?? [];
      list.push(log);
      byModel.set(log.model, list);
    }
    return Array.from(byModel.entries()).map(([model, modelLogs]) => {
      const latencies = modelLogs.map((l) => l.latency).sort((a, b) => a - b);
      return {
        model,
        requests: modelLogs.length,
        totalCost: parseFloat(
          modelLogs.reduce((sum, l) => sum + l.cost, 0).toFixed(2)
        ),
        avgLatency: Math.round(
          modelLogs.reduce((sum, l) => sum + l.latency, 0) / modelLogs.length
        ),
        p95Latency: percentile(latencies, 0.95),
        tokensProcessed: modelLogs.reduce(
          (sum, l) => sum + l.tokensIn + l.tokensOut,
          0
        ),
      };
    });
  }, [rangeLogs]);

  const totalCost = data.reduce((s, m) => s + m.totalCost, 0);
  const maxCost = data.length
    ? Math.max(...data.map((m) => m.totalCost))
    : 0;

  // Build latency distribution buckets
  const latencyBuckets = [
    { label: "0-100ms", min: 0, max: 100 },
    { label: "100-200ms", min: 100, max: 200 },
    { label: "200-300ms", min: 200, max: 300 },
    { label: "300-500ms", min: 300, max: 500 },
    { label: "500ms+", min: 500, max: Infinity },
  ];

  const latencyDist = latencyBuckets.map((bucket) => ({
    ...bucket,
    count: rangeLogs.filter(
      (l) => l.latency >= bucket.min && l.latency < bucket.max
    ).length,
  }));

  const maxBucketCount = Math.max(...latencyDist.map((b) => b.count));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Cost and performance analytics across all model endpoints
            </p>
          </div>
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Cost and performance analytics across all model endpoints
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(["24h", "7d", "30d"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Model Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Latency</TableHead>
                <TableHead className="text-right">p95 Latency</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Tokens Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No usage data for this time range yet.
                  </TableCell>
                </TableRow>
              )}
              {data
                .sort((a, b) => b.requests - a.requests)
                .map((m) => (
                  <TableRow key={m.model}>
                    <TableCell className="font-medium">{m.model}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.requests.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.avgLatency}ms
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          m.p95Latency > 800
                            ? "text-yellow-600 dark:text-yellow-400"
                            : ""
                        }
                      >
                        {m.p95Latency}ms
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${m.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(m.tokensProcessed / 1_000_000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow className="font-semibold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {data
                    .reduce((s, m) => s + m.requests, 0)
                    .toLocaleString()}
                </TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right tabular-nums">
                  ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {(
                    data.reduce((s, m) => s + m.tokensProcessed, 0) / 1_000_000
                  ).toFixed(1)}
                  M
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost by Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Cost by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cost data for this time range yet.
                </p>
              )}
              {data
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((m) => {
                  const pct = maxCost > 0 ? (m.totalCost / maxCost) * 100 : 0;
                  return (
                    <div key={m.model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.model}</span>
                        <span className="text-muted-foreground tabular-nums">
                          ${m.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
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

        {/* Latency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Latency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latencyDist.map((bucket) => {
                const pct =
                  maxBucketCount > 0
                    ? (bucket.count / maxBucketCount) * 100
                    : 0;
                return (
                  <div key={bucket.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium font-mono text-xs">
                        {bucket.label}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {bucket.count.toLocaleString()} req
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          bucket.min >= 500
                            ? "bg-yellow-500/70"
                            : "bg-primary/70"
                        }`}
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
    </div>
  );
}
