"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Model, ModelProvider } from "@/lib/data/models";
import { listModels, createModel, updateModel } from "@/lib/data/api";
import { Plus, Circle } from "lucide-react";

export default function ModelsPage() {
  const [modelList, setModelList] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "OpenAI" as ModelProvider,
    modelId: "",
    endpoint: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listModels();
        if (!cancelled) setModelList(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load models");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleStatus(id: string) {
    const target = modelList.find((m) => m.id === id);
    if (!target) return;
    setError(null);
    try {
      const updated = await updateModel(id, {
        status: target.status === "active" ? "inactive" : "active",
      });
      setModelList((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update model");
    }
  }

  async function addModel() {
    if (!newModel.name || !newModel.modelId || !newModel.endpoint) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createModel(newModel);
      setModelList((prev) => [...prev, created]);
      setNewModel({ name: "", provider: "OpenAI", modelId: "", endpoint: "" });
      setDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add model");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Models</h1>
          <p className="text-muted-foreground">
            Manage your model registry and endpoint configuration
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Model</DialogTitle>
              <DialogDescription>
                Register a new model endpoint in your routing infrastructure.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="model-name">Name</Label>
                <Input
                  id="model-name"
                  placeholder="e.g. GPT-4 Turbo"
                  value={newModel.name}
                  onChange={(e) =>
                    setNewModel({ ...newModel, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={newModel.provider}
                  onValueChange={(val: string | null) =>
                    setNewModel({ ...newModel, provider: val as ModelProvider })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Anthropic">Anthropic</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-id">Model ID</Label>
                <Input
                  id="model-id"
                  placeholder="e.g. gpt-4-turbo"
                  value={newModel.modelId}
                  onChange={(e) =>
                    setNewModel({ ...newModel, modelId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-endpoint">API Endpoint</Label>
                <Input
                  id="model-endpoint"
                  placeholder="https://api.example.com/v1/completions"
                  value={newModel.endpoint}
                  onChange={(e) =>
                    setNewModel({ ...newModel, endpoint: e.target.value })
                  }
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={addModel} disabled={saving}>
                {saving ? "Adding..." : "Add Model"}
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Avg Latency</TableHead>
                  <TableHead className="text-right">Cost / 1K Tokens</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No models registered yet. Add a model to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  modelList.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{model.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {model.modelId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Circle
                            className={`h-2 w-2 fill-current ${
                              model.status === "active"
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm capitalize">{model.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {model.avgLatency > 0 ? `${model.avgLatency}ms` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {model.costPer1kTokens > 0
                          ? `$${model.costPer1kTokens.toFixed(5)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(model.id)}
                        >
                          {model.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
