"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconLayoutGrid, IconPlus, IconX } from "@tabler/icons-react";
import type { SerializedProject } from "@/lib/projects/serialize";

const COLORS = ["#3b82c4", "#7b61c9", "#34a853", "#e67e22", "#c0392b", "#0f766e"];

export function ProjectsView({
  beneficiaryId,
  canWrite,
}: {
  beneficiaryId: string | null;
  canWrite: boolean;
}) {
  const [projects, setProjects] = useState<SerializedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!beneficiaryId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?beneficiaryId=${beneficiaryId}`);
      const data = await res.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!beneficiaryId || !name.trim()) {
      setError("Give the project a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, name: name.trim(), description: description.trim(), color }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not create.");
      return;
    }
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setAdding(false);
    await load();
  }

  if (!beneficiaryId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile to create custom projects.
      </div>
    );
  }

  const active = projects.filter((p) => p.status === "active");
  const other = projects.filter((p) => p.status !== "active");

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-bold text-[var(--color-cs-text)]">
            <IconLayoutGrid size={22} stroke={1.8} aria-hidden />
            Projects
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-cs-text-secondary)]">
            Custom workspaces for anything outside the standard programs — a move, an equipment
            order, household management.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            <IconPlus size={16} stroke={2} aria-hidden />
            New project
          </button>
        )}
      </header>

      {adding && (
        <div className="mb-4 rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[var(--color-cs-text)]">New project</span>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel">
              <IconX size={18} className="text-[var(--color-cs-text-muted)]" aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Custom wheelchair order"
              className="w-full rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about? (optional)"
              rows={2}
              className="w-full rounded-[10px] border border-[var(--color-cs-sep)] bg-[var(--color-cs-surface)] px-3 py-2 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]"
            />
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-[var(--color-cs-text)]" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {error && <p className="text-[12px] text-[#c0392b]">{error}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={create}
                disabled={saving}
                className="rounded-full bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-[16px] bg-[var(--color-cs-card)] px-4 py-10 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          No projects yet. Create one to track a custom effort end-to-end.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {other.length > 0 && (
            <>
              <h2 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                Done &amp; archived
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {other.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: SerializedProject }) {
  const pct = project.totalCount === 0 ? 0 : Math.round(((project.totalCount - project.openCount) / project.totalCount) * 100);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-[16px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14.5px] font-semibold text-[var(--color-cs-text)]">{project.name}</h3>
            {project.status !== "active" && (
              <span className="rounded-full bg-[var(--color-cs-surface)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--color-cs-text-muted)]">
                {project.status}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[var(--color-cs-text-secondary)]">
              {project.description}
            </p>
          )}
          {project.totalCount > 0 && (
            <div className="mt-2.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-cs-surface)]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: project.color }} />
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">
                {project.totalCount - project.openCount}/{project.totalCount} done
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
