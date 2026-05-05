// ─── Live Dashboard Tab ───────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Employee, TimeEntry } from "../types";
import { formatDateTime, formatElapsed } from "../lib/helpers";

export default function DashboardTab({
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
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const clockedIn = timeEntries.filter((te) => te.clockIn && !te.clockOut);

  return (
    <s-section heading="Live Dashboard">
      <s-stack gap="base">
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-badge
            tone={clockedIn.length > 0 ? "success" : "neutral"}
            size="large"
          >
            {clockedIn.length} Currently Clocked In
          </s-badge>
          <s-button variant="secondary" onClick={onRefresh} loading={loading}>
            Refresh
          </s-button>
        </s-stack>

        {loading && <s-spinner />}

        {!loading && clockedIn.length === 0 && (
          <s-banner tone="info">
            <s-text>No employees are currently clocked in.</s-text>
          </s-banner>
        )}

        {!loading && clockedIn.length > 0 && (
          <s-section padding="none">
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">Employee</s-table-header>
                <s-table-header listSlot="labeled">
                  Clocked In At
                </s-table-header>
                <s-table-header listSlot="labeled">Time Elapsed</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {clockedIn.map((te) => (
                  <s-table-row key={te.id}>
                    <s-table-cell>
                      <s-text type="strong">
                        {
                          employees.find((e) => e.id === te.employeeId)
                            ?.firstName
                        }{" "}
                        {
                          employees.find((e) => e.id === te.employeeId)
                            ?.lastName
                        }
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>{formatDateTime(te.clockIn)}</s-table-cell>
                    <s-table-cell>
                      <s-badge tone="success">
                        {formatElapsed(te.clockIn)}
                      </s-badge>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          </s-section>
        )}
      </s-stack>
    </s-section>
  );
}
