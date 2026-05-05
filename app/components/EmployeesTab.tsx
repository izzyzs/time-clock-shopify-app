import { useState, useRef } from "react";
import { Employee } from "../types";
import { Database } from "app/utils/database.types";
import { slugify } from "../lib/helpers";

// ─── Employees Tab ────────────────────────────────────────────────────────────

export default function EmployeesTab({
  employees,
  onRefresh,
  loading,
}: {
  employees: Employee[];
  onRefresh: () => Promise<void>;
  loading: boolean;
}) {
  const [actionError, setActionError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Add modal state
  const [addFirstName, setAddFirstName] = useState<string>("");
  const [addLastName, setAddLastName] = useState<string>("");

  const [addCode, setAddCode] = useState<string>("");
  const [addPin, setAddPin] = useState<string>("");
  const [addFirstNameError, setAddFirstNameError] = useState<string>("");
  const [addLastNameError, setAddLastNameError] = useState<string>("");
  const [addPinError, setAddPinError] = useState<string>("");
  const [addSubmitting, setAddSubmitting] = useState<boolean>(false);

  // Delete modal state
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const addModalRef = useRef<any>(null);
  const deleteModalRef = useRef<any>(null);

  function openAddModal() {
    setAddFirstName("");
    setAddLastName("");
    setAddPin("");
    setAddCode("");
    setAddFirstNameError("");
    setAddLastNameError("");
    setAddPinError("");
    setActionError("");
    setSuccessMsg("");
    addModalRef.current?.showOverlay?.();
  }

  function openDeleteModal(emp: Employee) {
    setDeleteEmployee(emp);
    setActionError("");
    setSuccessMsg("");
    deleteModalRef.current?.showOverlay?.();
  }

  async function handleAddEmployee() {
    setAddFirstNameError("");
    setAddPinError("");
    let valid = true;

    if (!addFirstName.trim()) {
      setAddFirstNameError("First name is required.");
      valid = false;
    }

    if (!addLastName.trim()) {
      setAddLastNameError("Last name is required.");
      valid = false;
    }
    if (!/^\d{4,8}$/.test(addPin)) {
      setAddPinError("PIN must be 4 to 8 digits.");
      valid = false;
    }
    if (!valid) return;

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: addFirstName.trim(),
          lastName: addLastName.trim(),
          code: addCode,
          pin: addPin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            `Failed to create employee "${addFirstName.trim()} ${addLastName.trim()}"`,
        );
      }
      setSuccessMsg(
        `Employee "${addFirstName.trim()} ${addLastName.trim()}" added successfully.`,
      );
      addModalRef.current?.hideOverlay?.();
      await onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to add employee.");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleDeleteEmployee() {
    console.log("handleDeleteEmployee");
    if (!deleteEmployee) return;
    setDeleteSubmitting(true);
    try {
      const init = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: +deleteEmployee.id,
        }),
      };
      console.log(`init: ${JSON.stringify(init)}`);
      const res = await fetch("/api/employees", init);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            `Failed to delete employee "${deleteEmployee.firstName.trim()} ${deleteEmployee.lastName.trim()} "`,
        );
      }

      setSuccessMsg(
        `Employee "${deleteEmployee.firstName} ${deleteEmployee.lastName}" removed.`,
      );
      deleteModalRef.current?.hideOverlay?.();
      await onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove employee.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <s-section heading="Employee Management">
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
          Add Employee
        </s-button>

        {loading && <s-spinner />}

        {!loading && employees.length === 0 && (
          <s-banner tone="info">
            <s-text>
              No employees yet. Add your first employee to get started.
            </s-text>
          </s-banner>
        )}

        {!loading && employees.length > 0 && (
          <s-section padding="none">
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">Name</s-table-header>
                <s-table-header listSlot="labeled">Status</s-table-header>
                <s-table-header listSlot="labeled">Actions</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {employees.map((emp) => (
                  <s-table-row key={emp.id}>
                    <s-table-cell>
                      <s-text type="strong">
                        {emp.firstName} {emp.lastName}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={emp.active ? "success" : "neutral"}>
                        {emp.active ? "Active" : "Inactive"}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      <s-button
                        variant="secondary"
                        tone="critical"
                        onClick={() => openDeleteModal(emp)}
                      >
                        Remove
                      </s-button>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          </s-section>
        )}
      </s-stack>

      {/* Add Employee Modal */}
      <s-modal id="add-employee-modal" heading="Add Employee" ref={addModalRef}>
        <s-stack gap="base">
          <s-text-field
            label="First Name"
            value={addFirstName}
            onInput={(e: Event) =>
              setAddFirstName((e.target as HTMLInputElement).value)
            }
            error={addFirstNameError}
            placeholder="e.g. Jane"
            required
          />
          <s-text-field
            label="Last Name"
            value={addLastName}
            onInput={(e: Event) =>
              setAddLastName((e.target as HTMLInputElement).value)
            }
            error={addLastNameError}
            placeholder="e.g. Smith"
            required
          />
          <s-text-field
            label="Store Code"
            value={addCode}
            onInput={(e: Event) =>
              setAddCode((e.target as HTMLInputElement).value)
            }
            placeholder="TXXX"
            required
          ></s-text-field>
          <s-password-field
            label="PIN (4–8 digits)"
            value={addPin}
            onInput={(e: Event) =>
              setAddPin((e.target as HTMLInputElement).value)
            }
            error={addPinError}
            placeholder="e.g. 1234"
            maxLength={8}
            required
          />
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleAddEmployee}
          loading={addSubmitting}
          disabled={addSubmitting}
        >
          Add Employee
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="add-employee-modal"
          command="--hide"
          disabled={addSubmitting}
        >
          Cancel
        </s-button>
      </s-modal>

      {/* Delete Employee Modal */}
      <s-modal
        id="delete-employee-modal"
        heading="Remove employee?"
        ref={deleteModalRef}
      >
        <s-stack gap="base">
          <s-text>
            Are you sure you want to remove{" "}
            <s-text type="strong">
              {deleteEmployee?.firstName} {deleteEmployee?.lastName}
            </s-text>
            ? Their time entries will remain in the log.
          </s-text>
          <s-text tone="caution">This action cannot be undone.</s-text>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          onClick={handleDeleteEmployee}
          loading={deleteSubmitting}
          disabled={deleteSubmitting}
        >
          Remove
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="delete-employee-modal"
          command="--hide"
          disabled={deleteSubmitting}
        >
          Cancel
        </s-button>
      </s-modal>
    </s-section>
  );
}
