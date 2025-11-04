"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");

  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "same-origin" });
        const j = await r.json();
        if (!mounted) return;

        if (!j.ok) {
          setErr(j.error || "Failed to load profile");
          setLoading(false);
          return;
        }

        setFullName(j.data.full_name || "");
        setEmail(j.data.email || "");
        setOrgName(j.data.organization?.name || "");
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load profile");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveProfile() {
    setErr("");
    setOk("");
    setSaving(true);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ full_name: fullName }),
      });
      const j = await r.json();
      setSaving(false);
      if (!j.ok) {
        setErr(j.error || "Failed to update profile");
        return;
      }
      setOk("Profile updated");
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (e: any) {
      setSaving(false);
      setErr(e?.message || "Failed to update profile");
    }
  }

  async function changePassword() {
    setPwMsg("");
    setPwErr("");
    try {
      const r = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ current_password: currPw, new_password: newPw }),
      });
      const j = await r.json();
      if (!j.ok) {
        setPwErr(j.error || "Password change failed");
        return;
      }
      setPwMsg("Password updated successfully");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrPw("");
      setNewPw("");
    } catch (e: any) {
      setPwErr(e?.message || "Password change failed");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and application settings</p>
        </div>

        {/* Profile */}
        <section className="rounded-xl border p-6 bg-white">
          <h2 className="font-semibold">Profile</h2>
          <p className="text-sm text-gray-600">Update your personal information</p>
          {loading ? (
            <div className="mt-4 text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="mt-4 space-y-3 max-w-lg">
              {err && <div className="text-sm text-red-600">{err}</div>}
              {ok && <div className="text-sm text-green-600">{ok}</div>}

              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email (cannot change)</label>
                <input
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value={email || ""}
                  disabled
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="mt-2 bg-black text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {saving ? "Saving…" : "Update Profile"}
              </button>
            </div>
          )}
        </section>

        {/* Security */}
        <section className="rounded-xl border p-6 bg-white">
          <h2 className="font-semibold">Security</h2>
          <p className="text-sm text-gray-600">Manage your security settings</p>

          <div className="mt-4 grid gap-3 max-w-xl">
            {pwErr && <div className="text-sm text-red-600">{pwErr}</div>}
            {pwMsg && <div className="text-sm text-green-600">{pwMsg}</div>}

            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Current Password"
              type="password"
              value={currPw}
              onChange={(e) => setCurrPw(e.target.value)}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="New Password"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />

            <button
              onClick={changePassword}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Change Password
            </button>
          </div>
        </section>

        {/* Organization */}
        <section className="rounded-xl border p-6 bg-white">
          <h2 className="font-semibold">Organization</h2>
          <p className="text-sm text-gray-600">Manage your organization settings (read-only)</p>
          <div className="mt-4 max-w-lg">
            <label className="text-sm text-gray-600">Organization Name</label>
            <input
              className="w-full border rounded px-3 py-2 bg-gray-50"
              value={orgName || ""}
              disabled
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
