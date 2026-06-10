"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { RequestLog } from "@/lib/data/models";
import { listUsageLogs } from "@/lib/data/api";
import { Search, X } from "lucide-react";

const PAGE_SIZE = 50;

export default function LogsPage() {
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination whenever the filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, modelFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listUsageLogs(500);
        if (!cancelled) setRequestLogs(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueModels = useMemo(
    () => [...new Set(requestLogs.map((l) => l.model))],
    [requestLogs]
  );

  const filtered = useMemo(() => {
    return requestLogs.filter((log) => {
      if (modelFilter !== "all" && log.model !== modelFilter) return false;
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (
        search &&
        !log.model.toLowerCase().includes(search.toLowerCase()) &&
        !log.id.toLowerCase().includes(search.toLowerCase()) &&
        !(log.policyMatched || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [requestLogs, search, modelFilter, statusFilter]);

  function openDetail(log: RequestLog) {
    setSelectedLog(log);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground">
          Inspect individual requests routed through the Neurl gateway
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by model, ID, or policy..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={modelFilter} onValueChange={(v) => setModelFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {uniqueModels.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        {(search || modelFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setModelFilter("all");
              setStatusFilter("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length > visibleCount
            ? `Showing ${Math.min(visibleCount, filtered.length)} of ${filtered.length} results`
            : `${filtered.length} results`}
        </span>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Tokens In</TableHead>
                  <TableHead className="text-right">Tokens Out</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Policy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      {requestLogs.length === 0
                        ? "No requests logged yet."
                        : "No requests match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, visibleCount).map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(log)}
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.model}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {log.tokensIn.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {log.tokensOut.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {log.latency}ms
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        ${log.cost.toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "success" ? "secondary" : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {log.policyMatched || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length > visibleCount && (
            <div className="flex items-center justify-center border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleCount((count) => count + PAGE_SIZE)
                }
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader>
                <SheetTitle>Request Detail</SheetTitle>
                <SheetDescription>{selectedLog.id}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-4 px-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-medium">{selectedLog.model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        selectedLog.status === "success"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timestamp</p>
                    <p className="font-medium font-mono text-xs">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latency</p>
                    <p className="font-medium tabular-nums">
                      {selectedLog.latency}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tokens In / Out</p>
                    <p className="font-medium tabular-nums">
                      {selectedLog.tokensIn.toLocaleString()} /{" "}
                      {selectedLog.tokensOut.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-medium tabular-nums">
                      ${selectedLog.cost.toFixed(6)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Policy Matched</p>
                    <p className="font-medium">
                      {selectedLog.policyMatched || "None (default routing)"}
                    </p>
                  </div>
                </div>

                {/* Request Body */}
                <div>
                  <p className="text-sm font-medium mb-2">Request</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {selectedLog.requestBody}
                  </pre>
                </div>

                {/* Response Body */}
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {selectedLog.responseBody}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
