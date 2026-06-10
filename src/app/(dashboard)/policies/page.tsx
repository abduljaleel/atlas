"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Model, Policy } from "@/lib/data/models";
import {
  listPolicies,
  listModels,
  createPolicy,
  updatePolicy,
} from "@/lib/data/api";
import { Plus, GripVertical, Circle, Shield, Zap, DollarSign } from "lucide-react";

const conditionIcons: Record<string, React.ReactNode> = {
  content_contains: <Shield className="h-3.5 w-3.5" />,
  cost_exceeds: <DollarSign className="h-3.5 w-3.5" />,
  latency_exceeds: <Zap className="h-3.5 w-3.5" />,
};

const conditionLabels: Record<string, string> = {
  content_contains: "Content contains",
  cost_exceeds: "Cost exceeds",
  latency_exceeds: "Latency exceeds",
};

export default function PoliciesPage() {
  const [policyList, setPolicyList] = useState<Policy[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    priority: 1,
    conditionType: "content_contains" as Policy["conditions"][0]["type"],
    conditionValue: "",
    targetModel: "",
    fallbackModel: "",
    costCeiling: "",
    latencyMax: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [policiesData, modelsData] = await Promise.all([
          listPolicies(),
          listModels(),
        ]);
        if (cancelled) return;
        setPolicyList(policiesData);
        setModels(modelsData);
        setNewPolicy((prev) => ({
          ...prev,
          priority: policiesData.length + 1,
          targetModel: prev.targetModel || modelsData[0]?.name || "",
          fallbackModel:
            prev.fallbackModel ||
            modelsData[1]?.name ||
            modelsData[0]?.name ||
            "",
        }));
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load policies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addPolicy() {
    if (!newPolicy.name || !newPolicy.conditionValue || !newPolicy.targetModel)
      return;
    setSaving(true);
    setError(null);
    try {
      const created = await createPolicy({
        name: newPolicy.name,
        priority: newPolicy.priority,
        conditions: [
          {
            type: newPolicy.conditionType,
            value: newPolicy.conditionValue,
          },
        ],
        targetModel: newPolicy.targetModel,
        fallbackModel: newPolicy.fallbackModel,
        costCeiling: newPolicy.costCeiling
          ? parseFloat(newPolicy.costCeiling)
          : null,
        latencyMax: newPolicy.latencyMax
          ? parseInt(newPolicy.latencyMax, 10)
          : null,
      });
      setPolicyList((prev) =>
        [...prev, created].sort((a, b) => a.priority - b.priority)
      );
      setDialogOpen(false);
      setNewPolicy({
        name: "",
        priority: policyList.length + 2,
        conditionType: "content_contains",
        conditionValue: "",
        targetModel: models[0]?.name || "",
        fallbackModel: models[1]?.name || models[0]?.name || "",
        costCeiling: "",
        latencyMax: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create policy");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: string) {
    const target = policyList.find((p) => p.id === id);
    if (!target) return;
    setError(null);
    try {
      const updated = await updatePolicy(id, {
        status: target.status === "active" ? "inactive" : "active",
      });
      setPolicyList((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update policy");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <p className="text-muted-foreground">
            Define routing rules that control how requests are dispatched to
            models
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Policy
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Routing Policy</DialogTitle>
              <DialogDescription>
                Policies are evaluated in priority order. First match wins.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    placeholder="e.g. Code → GPT-4o"
                    value={newPolicy.name}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-priority">Priority</Label>
                  <Input
                    id="policy-priority"
                    type="number"
                    min={1}
                    value={newPolicy.priority}
                    onChange={(e) =>
                      setNewPolicy({
                        ...newPolicy,
                        priority: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Condition Type</Label>
                <Select
                  value={newPolicy.conditionType}
                  onValueChange={(val: string | null) =>
                    setNewPolicy({
                      ...newPolicy,
                      conditionType:
                        val as Policy["conditions"][0]["type"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content_contains">
                      Content contains keywords
                    </SelectItem>
                    <SelectItem value="cost_exceeds">
                      Cost exceeds threshold
                    </SelectItem>
                    <SelectItem value="latency_exceeds">
                      Latency exceeds threshold
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition-value">Condition Value</Label>
                <Input
                  id="condition-value"
                  placeholder={
                    newPolicy.conditionType === "content_contains"
                      ? "code, function, debug"
                      : newPolicy.conditionType === "cost_exceeds"
                        ? "$0.10"
                        : "500ms"
                  }
                  value={newPolicy.conditionValue}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      conditionValue: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Model</Label>
                  <Select
                    value={newPolicy.targetModel}
                    onValueChange={(val: string | null) =>
                      setNewPolicy({ ...newPolicy, targetModel: val ?? "" })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fallback Model</Label>
                  <Select
                    value={newPolicy.fallbackModel}
                    onValueChange={(val: string | null) =>
                      setNewPolicy({ ...newPolicy, fallbackModel: val ?? "" })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost-ceiling">Cost Ceiling ($)</Label>
                  <Input
                    id="cost-ceiling"
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    value={newPolicy.costCeiling}
                    onChange={(e) =>
                      setNewPolicy({
                        ...newPolicy,
                        costCeiling: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latency-max">Latency Max (ms)</Label>
                  <Input
                    id="latency-max"
                    type="number"
                    placeholder="5000"
                    value={newPolicy.latencyMax}
                    onChange={(e) =>
                      setNewPolicy({
                        ...newPolicy,
                        latencyMax: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button onClick={addPolicy} disabled={saving}>
                {saving ? "Creating..." : "Create Policy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : policyList.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No routing policies yet. Create a policy to control how requests
            are dispatched.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...policyList]
            .sort((a, b) => a.priority - b.priority)
            .map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 pt-0.5">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground w-4 text-center">
                        {policy.priority}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{policy.name}</h3>
                        <Badge
                          variant={
                            policy.status === "active" ? "default" : "outline"
                          }
                          className="text-[10px]"
                        >
                          <Circle
                            className={`h-1.5 w-1.5 mr-1 fill-current ${
                              policy.status === "active"
                                ? "text-green-400"
                                : "text-muted-foreground"
                            }`}
                          />
                          {policy.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {policy.conditions.map((cond, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md"
                          >
                            {conditionIcons[cond.type]}
                            <span className="text-muted-foreground">
                              {conditionLabels[cond.type]}:
                            </span>
                            <span className="font-medium">{cond.value}</span>
                          </div>
                        ))}
                        {policy.costCeiling && (
                          <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="text-muted-foreground">
                              Ceiling:
                            </span>
                            <span className="font-medium">
                              ${policy.costCeiling.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {policy.latencyMax && (
                          <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md">
                            <Zap className="h-3.5 w-3.5" />
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-medium">
                              {policy.latencyMax}ms
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Target:{" "}
                          <span className="text-foreground font-medium">
                            {policy.targetModel}
                          </span>
                        </span>
                        <span>
                          Fallback:{" "}
                          <span className="text-foreground font-medium">
                            {policy.fallbackModel}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(policy.id)}
                    >
                      {policy.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
