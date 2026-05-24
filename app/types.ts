import { Database } from "./utils/database.types";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  active: boolean;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  location: string;
  firstName: string;
  lastName: string;
  clockIn: string;
  clockOut: string;
  notes: string;
}

export interface Report {
  employeeId: number;
  firstName: string;
  lastName: string;
  hours: number;
  shifts: number;
  averageShift: number;
}

export type CreateReportReturns =
  Database["public"]["Functions"]["create_time_report"]["Returns"][number];
export type CreateReportArgs =
  Database["public"]["Functions"]["create_time_report"]["Args"];

export type CreateTimeLogReportReturns =
  Database["public"]["Functions"]["create_time_log_report"]["Returns"][number];
export type CreateTimeLogReportArgs =
  Database["public"]["Functions"]["create_time_log_report"]["Args"];

export function returnRowToReport(r: CreateReportReturns): Report {
  return {
    employeeId: r.employee_id,
    firstName: r.employee_first_name,
    lastName: r.employee_last_name,
    hours: r.hours,
    shifts: r.shifts,
    averageShift: r.avg_shift,
  };
}

/**
 * 
 * 
 * export interface TimeEntry {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string;
  notes: string;
}
  
*/
export function returnRowToTimeEntry(r: CreateTimeLogReportReturns): TimeEntry {
  return {
    id: r.id.toString(),
    employeeId: r.employee_id.toString(),
    location: r.location,
    firstName: r.first_name,
    lastName: r.last_name,
    clockIn: r.clock_in,
    clockOut: r.clock_out,
    notes: r.notes,
  };
}

export type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

export const employeeRowToState = (r: EmployeeRow): Employee => {
  return {
    id: r.id.toString(),
    firstName: r.first_name,
    lastName: r.last_name,
    code: r.code,
    active: r.active,
  };
};

// export type TimeEntryRow = Database["public"]["Tables"]["time_entries"]["Row"];

export const timeEntryRowToState = (
  r: CreateTimeLogReportReturns,
): TimeEntry => {
  return {
    id: r.id.toString(),
    location: r.location,
    employeeId: r.employee_id ? r.employee_id.toString() : "",
    firstName: r.first_name,
    lastName: r.last_name,
    clockIn: r.clock_in,
    clockOut: r.clock_out ?? "",
    notes: r.notes ?? "",
  };
};

export type Tab =
  | "clockinout"
  | "dashboard"
  | "timelog"
  | "reports"
  | "employees"
  | "location";
