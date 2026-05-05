// import "@shopify/ui-extensions/preact";
// import { useState, useEffect } from "preact/hooks";
import { Employee, TimeEntry } from "../types";
import { useState } from "react";
// import { CREATE_TIME_ENTRY, UPDATE_TIME_ENTRY } from "../lib/graphql";
import { formatTime, formatDateTime, formatElapsed } from "../lib/helpers";
import { ActionFunction, useActionData, Form } from "react-router";
import bcrypt from "bcrypt";

export default function ClockInOutTab({
  employees,
  timeEntries,
  onRefresh,
  loading,
}: {
  employees: Employee[];
  timeEntries: TimeEntry[];
  onRefresh: () => Promise<void>;
  loading: boolean;
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeEmployees = employees.filter((e) => e.active);
  const selectedEmployee =
    employees.find((e) => e.id === selectedEmployeeId) || null;

  const openEntry = selectedEmployee
    ? timeEntries.find(
        (te) => te.employeeId === selectedEmployee.id && !te.clockOut,
      )
    : null;

  // const actionData = useActionData<typeof handleClockAction>();

  const handleEmployeeChange = (e: Event) => {
    console.log("handleEmployeeChange called");
    const value = (e.target as HTMLSelectElement).value;
    console.log(`new employee: ${value}`);
    setSelectedEmployeeId(value);
    setPin("");
    setPinError("");
    setActionError("");
    setSuccessMsg("");
  };

  function handlePinInput(e: Event) {
    setPin((e.target as HTMLInputElement).value);
    setPinError("");
  }

  async function handleClockAction() {
    if (!selectedEmployee) return;
    setPinError("");
    setActionError("");
    setSuccessMsg("");

    // if (pin !== selectedEmployee.pin) {
    //   setPinError("Incorrect PIN. Please try again.");
    //   return;
    // }

    setSubmitting(true);
    try {
      if (!openEntry) {
        // Clock In
        const now = new Date().toISOString();
        const res = await fetch("/api/clock-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedEmployeeId, pin, now }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to clock in");
        }
        setSuccessMsg(
          `${selectedEmployee.firstName} ${selectedEmployee.lastName} clocked in successfully at ${formatTime(now)}.`,
        );

        // success: maybe show a banner or toast here
        /*const { data, errors } = await shopify.query(CREATE_TIME_ENTRY, {
                  variables: {
                    metaobject: {
                      type: "sidekick_time_entry",
                      fields: [
                        { key: "employee_id", value: selectedEmployee.id },
                        { key: "employee_name", value: selectedEmployee.name },
                        { key: "clock_in", value: now },
                      ],
                    },
                  },
                });
                if (errors?.length)
                  throw new Error(errors.map((e: any) => e.message).join(", "));
                if (data?.metaobjectCreate?.userErrors?.length) {
                  throw new Error(
                    data.metaobjectCreate.userErrors
                      .map((e: any) => e.message)
                      .join(", "),
                  );
                }*/
      } else {
        // Clock Out
        const now = new Date().toISOString();
        const res = await fetch("/api/clock-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: openEntry.id, now }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to clock out");
        }
        setSuccessMsg(
          `${selectedEmployee.firstName} ${selectedEmployee.lastName} clocked out successfully at ${formatTime(now)}.`,
        );
      }
      setPin("");
      setSelectedEmployeeId("");
      await onRefresh();
    } catch (err: any) {
      setActionError(err.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <s-section heading="Clock In / Out">
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
        <s-select
          label="Select Employee"
          value={selectedEmployeeId}
          onChange={handleEmployeeChange}
          placeholder="Choose an employee..."
        >
          {activeEmployees.map((emp) => (
            <s-option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </s-option>
          ))}
        </s-select>

        {selectedEmployee && (
          <>
            <s-password-field
              label="PIN"
              value={pin}
              onInput={handlePinInput}
              error={pinError}
              placeholder="Enter your PIN"
              maxLength={8}
            />

            {openEntry && (
              <s-banner tone="info">
                <s-text>
                  {selectedEmployee.firstName} {selectedEmployee.lastName} is
                  currently clocked in since {formatDateTime(openEntry.clockIn)}{" "}
                  ({formatElapsed(openEntry.clockIn)} elapsed).
                </s-text>
              </s-banner>
            )}

            <s-button
              variant="primary"
              tone={openEntry ? "critical" : "auto"}
              onClick={handleClockAction}
              loading={submitting}
              disabled={!pin || submitting || loading}
            >
              {openEntry ? "Clock Out" : "Clock In"}
            </s-button>
          </>
        )}

        {activeEmployees.length === 0 && !loading && (
          <s-banner tone="warning">
            <s-text>
              No active employees found. Please add employees in the Employees
              tab.
            </s-text>
          </s-banner>
        )}
      </s-stack>
    </s-section>
  );
}
