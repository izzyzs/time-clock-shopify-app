import { useState, useRef } from "react";
import { Employee, TimeEntry } from "../types";
import {
  combineDateTimeToISO,
  formatDate,
  formatTime,
  formatDuration,
} from "../lib/helpers";
import { CallbackEvent } from "@shopify/polaris-types";
// import { UPDATE_TIME_ENTRY, DELETE_METAOBJECT } from "../lib/graphql";
// ─── Time Log Tab ─────────────────────────────────────────────────────────────

type Time = { hours: number; minutes: number; period: "AM" | "PM" };
const DEFAULT_TIME: Time = { hours: 12, minutes: 0, period: "AM" };

function stringToTime(str: string): Time {
  const strStripped = str.trim();
  const isValidTime = /[\d|\d\d]:\d\d [A|P]M/.test(strStripped);

  if (!isValidTime) throw new Error(`string ${strStripped} is not parsable`);

  const [timePart, periodPart] = strStripped.split(" ");

  if (periodPart !== "AM" && periodPart !== "PM") {
    throw new Error("Invalid period");
  }

  const [hourPart, minutePart] = timePart.split(":");

  return { hours: +hourPart, minutes: +minutePart, period: periodPart };
}

function timeToString(time: Time): string {
  const hoursString = time.hours.toString();
  const minutesString = time.minutes.toString();
  if (hoursString.length > 2 || minutesString.length > 2)
    throw Error(
      `hours or minutes poorly formatted:\n hours ${hoursString}\n minutes ${minutesString}`,
    );

  return `${hoursString}:${minutesString} ${time.period}`;
}

export default function TimeLogTab({
  employees,
  timeEntries,
  loading,
  onRefresh,
}: {
  employees: Employee[];
  timeEntries: TimeEntry[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const PAGE_SIZE = 50;
  const [page, setPage] = useState<number>(0);
  const [actionError, setActionError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Edit modal state
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editClockInDate, setEditClockInDate] = useState<string>("");
  const [editClockInTime, setEditClockInTime] = useState<Time>(DEFAULT_TIME);
  const [editClockOutDate, setEditClockOutDate] = useState<string>("");
  const [editClockOutTime, setEditClockOutTime] = useState<Time>(DEFAULT_TIME);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  // Delete modal state
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const editModalRef = useRef<any>(null);
  const deleteModalRef = useRef<any>(null);

  // Sort entries newest first
  const sorted = [...timeEntries].sort(
    (a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime(),
  );
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry);
    setEditClockInDate(formatDate(entry.clockIn));
    setEditClockInTime(stringToTime(formatTime(entry.clockIn)));
    setEditClockOutDate(formatDate(entry.clockOut));
    setEditClockOutTime(stringToTime(formatTime(entry.clockOut)));
    setEditNotes(entry.notes);
    setEditError("");
    editModalRef.current?.showOverlay?.();
  }

  function openDelete(entry: TimeEntry) {
    setDeleteEntry(entry);
    deleteModalRef.current?.showOverlay?.();
  }

  async function handleEditSave() {
    if (!editEntry) {
      console.log("no editEntry");
      return;
    }
    setEditError("");

    const newClockIn = combineDateTimeToISO(
      editClockInDate,
      timeToString(editClockInTime!),
    );
    const newClockOut =
      editClockOutDate && editClockOutTime
        ? combineDateTimeToISO(editClockOutDate, timeToString(editClockOutTime))
        : "";

    if (!newClockIn) {
      setEditError("Clock in date and time are required.");
      return;
    }
    if (newClockOut && new Date(newClockOut) <= new Date(newClockIn)) {
      setEditError("Clock out time must be after clock in time.");
      return;
    }

    const updateData = {
      clockIn: newClockIn,
      notes: editNotes,
      clockOut: newClockOut,
    };

    console.log(`updateData: ${JSON.stringify(updateData)}`);

    setEditSubmitting(true);
    try {
      // const fields: { key: string; value: string }[] = [
      //   { key: "clock_in", value: newClockIn },
      //   { key: "notes", value: editNotes },
      // ];
      // if (newClockOut) fields.push({ key: "clock_out", value: newClockOut });

      const res = await fetch(`/api/time-entry/${editEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update the entry");
      }

      setSuccessMsg("Time entry updated successfully.");
      editModalRef.current?.hideOverlay?.();
      await onRefresh();
    } catch (err: any) {
      setEditError(err.message || "Failed to update entry.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteEntry) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/time-entry/${deleteEntry.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete the entry");
      }

      setSuccessMsg("Time entry deleted.");
      deleteModalRef.current?.hideOverlay?.();
      await onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to delete entry.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <s-section heading="Time Log">
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

      {loading && <s-spinner />}

      {!loading && timeEntries.length === 0 && (
        <s-banner tone="info">
          <s-text>
            No time entries yet. Entries will appear here after employees clock
            in.
          </s-text>
        </s-banner>
      )}

      {!loading && timeEntries.length > 0 && (
        <s-section padding="none">
          <s-table
            paginate={totalPages > 1}
            hasNextPage={page < totalPages - 1}
            hasPreviousPage={page > 0}
            onNextPage={() => setPage((p) => p + 1)}
            onPreviousPage={() => setPage((p) => p - 1)}
          >
            <s-table-header-row>
              <s-table-header listSlot="primary">Employee</s-table-header>
              <s-table-header listSlot="labeled">Date</s-table-header>
              <s-table-header listSlot="labeled">Clock In</s-table-header>
              <s-table-header listSlot="labeled">Date</s-table-header>
              <s-table-header listSlot="labeled">Clock Out</s-table-header>
              <s-table-header listSlot="labeled">Duration</s-table-header>
              <s-table-header listSlot="labeled">Actions</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {paged.map((te) => (
                <s-table-row key={te.id}>
                  <s-table-cell>
                    <s-text type="strong">
                      {employees.find((e) => e.id === te.employeeId)?.firstName}{" "}
                      {employees.find((e) => e.id === te.employeeId)?.lastName}
                    </s-text>
                  </s-table-cell>
                  <s-table-cell>{formatDate(te.clockIn)}</s-table-cell>
                  <s-table-cell>{formatTime(te.clockIn)}</s-table-cell>
                  <s-table-cell>{formatDate(te.clockOut)}</s-table-cell>
                  <s-table-cell>
                    {te.clockOut ? (
                      formatTime(te.clockOut)
                    ) : (
                      <s-badge tone="success">In Progress</s-badge>
                    )}
                  </s-table-cell>
                  <s-table-cell>
                    {formatDuration(te.clockIn, te.clockOut)}
                  </s-table-cell>
                  <s-table-cell>
                    <s-stack direction="inline" gap="small">
                      <s-button
                        variant="secondary"
                        onClick={() => openEdit(te)}
                      >
                        Edit
                      </s-button>
                      <s-button
                        variant="secondary"
                        tone="critical"
                        onClick={() => openDelete(te)}
                      >
                        Delete
                      </s-button>
                    </s-stack>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}

      {/* Edit Modal */}
      <s-modal
        id="edit-entry-modal"
        heading="Edit Time Entry"
        ref={editModalRef}
      >
        <s-stack gap="base">
          {editError && (
            <s-banner tone="critical">
              <s-text>{editError}</s-text>
            </s-banner>
          )}
          <s-text type="strong">Clock In</s-text>
          <s-stack direction="inline" gap="base">
            <s-date-field
              label="Date"
              value={editClockInDate}
              onChange={(e: Event) =>
                setEditClockInDate((e.target as HTMLInputElement).value)
              }
            />
            <s-stack direction="inline">
              <s-box inlineSize="50%">
                <s-number-field
                  label="Hours:"
                  // details="Number of items in stock"
                  placeholder="1"
                  value={editClockInTime.hours.toString()}
                  onInput={(e: CallbackEvent<"s-number-field">) => {
                    const value = +e.currentTarget.value;
                    if (value !== 0 && !value) return;

                    setEditClockInTime((time) => {
                      return {
                        ...time,
                        hours: value,
                      };
                    });
                  }}
                  step={1}
                  min={1}
                  max={12}
                ></s-number-field>
              </s-box>
              <s-box inlineSize="50%">
                <s-number-field
                  label="Minutes:"
                  // details="Number of items in stock"
                  placeholder="00"
                  value={editClockInTime.minutes.toString()}
                  onInput={(e: CallbackEvent<"s-number-field">) => {
                    const value = +e.currentTarget.value;
                    if (value !== 0 && !value) return;

                    setEditClockInTime((time) => {
                      return {
                        ...time,
                        minutes: value,
                      };
                    });
                  }}
                  step={5}
                  min={0}
                  max={59}
                ></s-number-field>
              </s-box>
              <s-box>
                <s-select
                  label="AM/PM"
                  value={editClockInTime.period}
                  onInput={(event: CallbackEvent<"s-select">) => {
                    const value = event.currentTarget.value;
                    if (value !== "AM" && value !== "PM") return;

                    setEditClockInTime((time) => {
                      return {
                        ...time,
                        period: value,
                      };
                    });
                  }}
                >
                  <s-option>AM</s-option>
                  <s-option>PM</s-option>
                </s-select>
              </s-box>
            </s-stack>
          </s-stack>
          <s-text type="strong">Clock Out</s-text>
          <s-stack direction="inline" gap="base">
            <s-date-field
              label="Date"
              value={editClockOutDate}
              onChange={(e: Event) =>
                setEditClockOutDate((e.target as HTMLInputElement).value)
              }
            />
            <s-stack direction="inline">
              <s-box inlineSize="50%">
                <s-number-field
                  label="Hours:"
                  // details="Number of items in stock"
                  placeholder="1"
                  value={editClockOutTime.hours.toString()}
                  onInput={(e: CallbackEvent<"s-number-field">) => {
                    const value = +e.currentTarget.value;
                    if (value !== 0 && !value) return;

                    setEditClockOutTime((time) => {
                      return {
                        ...time,
                        hours: value,
                      };
                    });
                  }}
                  step={1}
                  min={1}
                  max={12}
                ></s-number-field>
              </s-box>
              <s-box inlineSize="50%">
                <s-number-field
                  label="Minutes:"
                  // details="Number of items in stock"
                  placeholder="00"
                  value={editClockOutTime.minutes.toString()}
                  onInput={(e: CallbackEvent<"s-number-field">) => {
                    const value = +e.currentTarget.value;
                    if (value !== 0 && !value) return;

                    setEditClockOutTime((time) => {
                      return {
                        ...time,
                        minutes: value,
                      };
                    });
                  }}
                  step={5}
                  min={0}
                  max={59}
                ></s-number-field>
              </s-box>
              <s-box>
                <s-select
                  label="AM/PM"
                  value={editClockOutTime.period}
                  onInput={(event: CallbackEvent<"s-select">) => {
                    console.log("AM/PM onInput called");
                  }}
                  onChange={(event: CallbackEvent<"s-select">) => {
                    const value = event.currentTarget.value;
                    console.log("AM/PM onChange called");

                    if (value !== "AM" && value !== "PM") return;

                    setEditClockOutTime((time) => {
                      return {
                        ...time,
                        period: value,
                      };
                    });
                  }}
                >
                  <s-option>AM</s-option>
                  <s-option>PM</s-option>
                </s-select>
              </s-box>
            </s-stack>
          </s-stack>
          <s-text-field
            label="Notes"
            value={editNotes}
            onInput={(e: Event) =>
              setEditNotes((e.target as HTMLInputElement).value)
            }
            placeholder="Optional notes"
          />
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleEditSave}
          loading={editSubmitting}
          disabled={editSubmitting}
        >
          Save Changes
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="edit-entry-modal"
          command="--hide"
          disabled={editSubmitting}
        >
          Cancel
        </s-button>
      </s-modal>

      {/* Delete Modal */}
      <s-modal
        id="delete-entry-modal"
        heading="Delete time entry?"
        ref={deleteModalRef}
      >
        <s-stack gap="base">
          <s-text>
            Are you sure you want to delete the time entry for{" "}
            <s-text type="strong">
              {
                employees.find((e) => e.id === deleteEntry?.employeeId)
                  ?.firstName
              }{" "}
              {
                employees.find((e) => e.id === deleteEntry?.employeeId)
                  ?.lastName
              }
            </s-text>{" "}
            on {deleteEntry ? formatDate(deleteEntry.clockIn) : ""}?
          </s-text>
          <s-text tone="caution">This action cannot be undone.</s-text>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          onClick={handleDelete}
          loading={deleteSubmitting}
          disabled={deleteSubmitting}
        >
          Delete
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="delete-entry-modal"
          command="--hide"
          disabled={deleteSubmitting}
        >
          Cancel
        </s-button>
      </s-modal>
    </s-section>
  );
}
