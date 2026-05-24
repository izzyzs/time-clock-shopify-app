export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid ISO date string");
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  // console.log("formatTime func");
  // console.log("***START***");
  if (!iso) return "—";
  const d = new Date(iso);
  // console.log("iso", iso);
  // console.log(d.toLocaleTimeString());
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // console.log("***END***");
  return time;
}

export function calcDurationHours(clockIn: string, clockOut: string): number {
  if (!clockIn || !clockOut) return 0;
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return diff / (1000 * 60 * 60);
}

export function formatDuration(clockIn: string, clockOut: string): string {
  if (!clockIn) return "—";
  if (!clockOut) return "In Progress";
  const hours = calcDurationHours(clockIn, clockOut);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function formatDurationInHours(
  clockIn: string,
  clockOut: string,
): string {
  if (!clockIn) return "—";
  if (!clockOut) return "In Progress";

  const hours = calcDurationHours(clockIn, clockOut);

  return `${hours.toFixed(2)}`;
}

export function formatElapsed(clockIn: string): string {
  const diff = Date.now() - new Date(clockIn).getTime();
  const totalMinutes = Math.floor(diff / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function isoToDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function combineDateTimeToISO(
  originalDate: string,
  originalTime: string,
): string {
  // console.log("combineDateTimeToISO");
  // console.log("***START***");
  if (!originalDate || !originalTime) return "";
  const converted = new Date(originalDate.trim());
  const date = converted.toISOString().split("T")[0];

  const time = originalTime.trim();
  // console.log("date", date);
  console.log("time", time);
  const [timeValue, originalTimePeriod] = time.split(" ");
  if (
    !originalTimePeriod ||
    (originalTimePeriod.toUpperCase() !== "AM" &&
      originalTimePeriod.toUpperCase() !== "PM")
  ) {
    console.log("!originalTimePeriod", !originalTimePeriod);
    console.log(
      `(originalTimePeriod.toUpperCase() !== "AM" &&
    originalTimePeriod.toUpperCase() !== "PM")`,
      originalTimePeriod.toUpperCase() !== "AM" &&
        originalTimePeriod.toUpperCase() !== "PM",
    );
    console.log(
      `
    originalTimePeriod.toUpperCase() !== "PM"`,
      originalTimePeriod.toUpperCase() !== "PM",
    );
    throw Error("Time Period Must be included: AM or PM");
  }
  const timePeriod = originalTimePeriod.toUpperCase();
  const [hours, minutes] = timeValue.split(":");
  const trueHours =
    timePeriod === "AM"
      ? +hours
      : +hours + 12 > 23
        ? +hours + 12 - 24
        : +hours + 12;

  // console.log("time", time);
  // console.log("timeValue", timeValue);
  // console.log("timePeriod", timePeriod);
  // console.log("hours", hours);
  // console.log("minutes", minutes);
  // console.log("trueHours", trueHours);
  // console.log(
  //   "trueHours.toString().length === 1:",
  //   trueHours.toString().length === 1,
  // );
  const trueHourString =
    trueHours.toString().length === 1
      ? `0${trueHours.toString()}`
      : trueHours.toString();
  const trueMinuteString =
    minutes.toString().length === 1
      ? `0${minutes.toString()}`
      : minutes.toString();
  const trueTime = `${trueHourString}:${trueMinuteString}`;
  // console.log("draft:", `${date}T${trueTime}:00`);
  const iso = new Date(`${date}T${trueTime}:00`).toISOString();
  // console.log("iso:", iso);
  // console.log("***END***");
  return iso;
}

export const hasRequiredKeys = (obj: object, keys: string[]) =>
  keys.every((key) => obj.hasOwnProperty(key));
