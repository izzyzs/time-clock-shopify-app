import { useState } from "react";
import {
  CreateReportArgs,
  CreateReportReturns,
  Employee,
  returnRowToReport,
  TimeEntry,
  Report,
} from "../types";
import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { CallbackEvent } from "@shopify/polaris-types";

type ReportsTabPageState = { changed: boolean; generated: boolean };

// ─── Reports Tab ──────────────────────────────────────────────────────────────

export default function ReportsTab({
  employees,
  loading,
}: {
  employees: Employee[];
  timeEntries: TimeEntry[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterError, setFilterError] = useState<string>("");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [pageState, setPageState] = useState<ReportsTabPageState>({
    changed: true,
    generated: false,
  });

  async function generateReport() {
    setFilterError("");
    if (filterStartDate && filterEndDate && filterEndDate < filterStartDate) {
      setFilterError("End date must be on or after start date.");
      return;
    }

    const url =
      filterEmployee !== "all"
        ? `/api/time-report?start_date=${filterStartDate}&end_date=${filterEndDate}&employee_id=${filterEmployee}`
        : `/api/time-report?start_date=${filterStartDate}&end_date=${filterEndDate}`;
    console.log("url", url);
    const res = await fetch(url, { method: "GET" });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Failed to clock out");
    }

    const reportEntries = data.map((i: CreateReportReturns) =>
      returnRowToReport(i),
    );

    setReports(reportEntries);
  }

  const totalHours = reports
    ? reports.reduce((sum, report) => sum + report.hours, 0)
    : 0;

  function buildCSV(): string {
    if (!reports) return "";
    const header = "First Name,Last Name,Shifts,Avg. Shift,Hours";
    const rows = reports.map((report) => {
      return [
        `"${report.firstName}"`,
        `"${report.lastName}"`,
        `"${report.shifts}"`,
        `"${report.averageShift}"`,
        `"${report.hours}"`,
      ].join(",");
    });
    return [header, ...rows].join("\n");
  }

  function buildPDF() {
    if (!reports) return;
    console.log("reports", reports);
    const docDefinition: TDocumentDefinitions = {
      content: [
        {
          columns: [
            {
              text: `Start Date: ${filterStartDate ? filterStartDate : "N/A"} to End Date: ${filterEndDate ? filterEndDate : "N/A"}`,
              width: "*",
            },
            {
              text: `Employee: ${filterEmployee === "all" ? filterEmployee : `${employees.find((e) => e.id === filterEmployee)?.firstName} ${employees.find((e) => e.id === filterEmployee)?.lastName}`}`,
            },
          ],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*", "*"],
            body: [
              [
                {
                  text: "First Name",
                  style: "tableHeader",
                  alignment: "center",
                },
                {
                  text: "Last Name",
                  style: "tableHeader",
                  alignment: "center",
                },
                {
                  text: "Shifts",
                  style: "tableHeader",
                  alignment: "center",
                },
                {
                  text: "Avg. Shift",
                  style: "tableHeader",
                  alignment: "center",
                },
                {
                  text: "Hours",
                  style: "tableHeader",
                  alignment: "center",
                },
              ],
              ...reports.map((r) => [
                r.firstName,
                r.lastName,
                r.shifts,
                r.averageShift,
                r.hours,
              ]),
            ],
          },
          style: { marginBottom: 5 },
        },
        { text: `Total Hours: ${totalHours}` },
      ],
      defaultStyle: {
        fontSize: 12,
      },
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: "black",
        },
      },
    };

    console.log("docDefinition", docDefinition);
    // pdfMake.createPdf(docDefinition).download(`timesheet-${today}.pdf`);
    pdfMake.createPdf(docDefinition).print();
  }

  const csvDataUrl = reports
    ? `data:text/csv;charset=utf-8,${encodeURIComponent(buildCSV())}`
    : "";

  const today = new Date().toISOString().slice(0, 10);

  return (
    <s-section heading="Timesheet Reports">
      <s-stack gap="base">
        {filterError && (
          <s-banner tone="critical">
            <s-text>{filterError}</s-text>
          </s-banner>
        )}

        <s-stack direction="inline" gap="base">
          <s-select
            label="Employee"
            value={filterEmployee}
            onChange={(event: CallbackEvent<"s-select">) => {
              setPageState({ generated: false, changed: true });
              setFilterEmployee(event.currentTarget.value);
            }}
          >
            <s-option value="all">All Employees</s-option>
            {employees.map((emp, idx) => (
              <s-option key={idx} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </s-option>
            ))}
          </s-select>

          <s-date-field
            label="Start Date"
            value={filterStartDate}
            onChange={(e: Event) => {
              setPageState({ generated: false, changed: true });
              setFilterStartDate((e.target as HTMLInputElement).value);
            }}
            allow={`--${today}`}
          />

          <s-date-field
            label="End Date"
            value={filterEndDate}
            onChange={(e: Event) => {
              setPageState({ generated: false, changed: true });
              setFilterEndDate((e.target as HTMLInputElement).value);
            }}
            allow={`--${today}`}
          />
        </s-stack>

        <s-button
          variant="primary"
          onClick={() => {
            setPageState((state) => ({ ...state, generated: true }));
            generateReport();
          }}
          loading={loading}
        >
          Generate Report
        </s-button>

        {reports !== null && pageState.changed && pageState.generated && (
          <>
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-badge tone="info" size="large">
                Total Hours: {totalHours.toFixed(2)}h
              </s-badge>
              <s-badge tone="neutral" size="large">
                {reports.length} Entries
              </s-badge>
              {reports.length > 0 && (
                <>
                  <s-link href={csvDataUrl} download={`timesheet-${today}.csv`}>
                    Export CSV
                  </s-link>
                  <s-link></s-link>
                  <s-button onClick={buildPDF}>Export PDF</s-button>
                </>
              )}
            </s-stack>

            {reports.length === 0 ? (
              <s-banner tone="info">
                <s-text>No time entries found for the selected filters.</s-text>
              </s-banner>
            ) : (
              <s-section padding="none">
                <s-table>
                  <s-table-header-row>
                    <s-table-header listSlot="primary">
                      First Name
                    </s-table-header>
                    <s-table-header listSlot="primary">
                      Last Name
                    </s-table-header>
                    <s-table-header listSlot="labeled">Shifts</s-table-header>
                    <s-table-header listSlot="labeled">
                      Avg. Shift
                    </s-table-header>
                    <s-table-header listSlot="labeled">Hours</s-table-header>
                  </s-table-header-row>
                  <s-table-body>
                    {reports.map((report, idx) => (
                      <s-table-row key={idx}>
                        <s-table-cell>
                          <s-text type="strong">{report.firstName}</s-text>
                        </s-table-cell>
                        <s-table-cell>
                          <s-text type="strong">{report.lastName}</s-text>
                        </s-table-cell>
                        <s-table-cell>{report.shifts}</s-table-cell>
                        <s-table-cell>{report.averageShift}</s-table-cell>
                        <s-table-cell>{report.hours}</s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              </s-section>
            )}
          </>
        )}
      </s-stack>
    </s-section>
  );
}
