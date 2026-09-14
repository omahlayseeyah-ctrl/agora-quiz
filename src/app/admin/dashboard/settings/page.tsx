"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import AlertBanner from "@/components/AlertBanner";

export default function AdminSettingsPage() {
  const [whatsappChannelLink, setWhatsappChannelLink] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/settings")
      .then((res) => {
        setWhatsappChannelLink(res.settings.whatsapp_channel_link || "");
        setContactPhoneNumber(res.settings.contact_phone_number || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ whatsappChannelLink, contactPhoneNumber }),
      });
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="font-poppins font-bold text-2xl mb-1">Platform Settings</h1>
      <p className="text-sm text-gray-500 dark:text-gray-300 font-nunito mb-6">
        These values are used across the student experience automatically — no code changes needed.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <form onSubmit={save} className="card p-6 max-w-lg font-nunito">
          {message && <div className="mb-4"><AlertBanner type="success" message={message} /></div>}
          {error && <div className="mb-4"><AlertBanner message={error} /></div>}

          <label className="label">WhatsApp Channel Link</label>
          <input
            className="input mb-5"
            placeholder="[PASTE WHATSAPP CHANNEL LINK HERE]"
            value={whatsappChannelLink}
            onChange={(e) => setWhatsappChannelLink(e.target.value)}
          />

          <label className="label">Complaint / Contact Phone Number</label>
          <input
            className="input mb-6"
            placeholder="[PASTE YOUR PHONE NUMBER HERE]"
            value={contactPhoneNumber}
            onChange={(e) => setContactPhoneNumber(e.target.value)}
          />

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "SAVE SETTINGS"}
          </button>
        </form>
      )}
    </AdminShell>
  );
}
