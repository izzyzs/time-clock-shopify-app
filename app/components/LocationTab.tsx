import { useState, useRef, useEffect } from "react";
import { Database } from "app/utils/database.types";
import { slugify } from "../lib/helpers";

// ─── Locations Tab ────────────────────────────────────────────────────────────

export default function LocationTab({ loading }: { loading: boolean }) {
  async function onRefresh() {
    try {
      const res = await fetch("/api/locations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `No Location Found"`);
      }
      setLocation(data.location);
    } catch (err: any) {
      setActionError(err.message || "Failed to retrieve location.");
    }
  }

  const [actionError, setActionError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [location, setLocation] = useState<string>("");

  // Add modal state
  const [addLocation, setAddLocation] = useState<string>("");
  const [addLocationError, setAddLocationError] = useState<string>("");

  const [addSubmitting, setAddSubmitting] = useState<boolean>(false);

  // Delete modal state

  useEffect(() => {
    onRefresh();
  }, []);

  const addModalRef = useRef<any>(null);

  function openAddModal() {
    setAddLocation("");
    setActionError("");
    setSuccessMsg("");
    addModalRef.current?.showOverlay?.();
  }

  async function handleAddLocation() {
    let valid = true;

    if (!addLocation.trim()) {
      setAddLocationError("Location is required.");
      valid = false;
    }
    if (!valid) return;

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: addLocation.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to create add location "${addLocation.trim()}"`,
        );
      }
      setSuccessMsg(`Location "${addLocation.trim()}" added successfully.`);
      addModalRef.current?.hideOverlay?.();
      await onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to add location.");
    } finally {
      setAddSubmitting(false);
    }
  }

  return (
    <s-section heading="Location Management">
      {successMsg && (
        <s-banner tone="success">
          <s-text>{successMsg}</s-text>
        </s-banner>
      )}
      {actionError && (
        <s-banner tone="critical">
          <s-text>{actionError}</s-text>
        </s-banner>
      )}

      <s-stack gap="base">
        <s-button variant="primary" onClick={openAddModal}>
          Add Location
        </s-button>

        {loading && <s-spinner />}

        {!loading && !location && (
          <s-banner tone="info">
            <s-text>Location not added. Add your location</s-text>
          </s-banner>
        )}

        {!loading && location && (
          <s-section padding="none">
            <s-text>Location: {location}</s-text>
          </s-section>
        )}
      </s-stack>

      {/* Add Location Modal */}
      <s-modal id="add-location-modal" heading="Add Location" ref={addModalRef}>
        <s-stack gap="base">
          <s-text-field
            label="Location"
            value={addLocation}
            onInput={(e: Event) =>
              setAddLocation((e.target as HTMLInputElement).value)
            }
            error={addLocationError}
            placeholder="e.g. Store Name or 123 Address Lane"
            required
          />
        </s-stack>

        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleAddLocation}
          loading={addSubmitting}
          disabled={addSubmitting}
        >
          Add Location
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="add-location-modal"
          command="--hide"
          disabled={addSubmitting}
        >
          Cancel
        </s-button>
      </s-modal>
    </s-section>
  );
}
