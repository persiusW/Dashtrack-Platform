"use client";
import { useEffect, useState } from "react";

export default function ActivationSelect({ onChange }: { onChange: (id: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/activations/list", { credentials: "same-origin" });
        const j = await r.json();
        if (!mounted) return;
        setItems(j?.ok ? j.items || [] : []);
      } catch {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <select className="border rounded px-2 py-1" disabled>
        <option>Loading…</option>
      </select>
    );
  }
  if (!items.length) {
    return (
      <select className="border rounded px-2 py-1" disabled>
        <option>No activations</option>
      </select>
    );
  }

  return (
    <select className="border rounded px-2 py-1" onChange={(e) => onChange(e.target.value)}>
      {items.map((a: any) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
