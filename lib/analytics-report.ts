import type { AppointmentView } from "@/lib/types";

export const PSYCHECK_RECORDS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1BkMgVAJr6y3Lf6z4akrBckGmgRE1CL_FGaOIRAb28W4/edit?gid=0#gid=0";

export type CountRow = { label: string; value: number; description?: string };

export type AnalyticsReport = {
  generatedAt: string;
  studentsCount: number;
  total: number;
  summary: CountRow[];
  services: CountRow[];
  yearLevels: CountRow[];
  statuses: CountRow[];
  modes: CountRow[];
  appointments: AppointmentView[];
};

function percent(value: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function countOf(
  appointments: AppointmentView[],
  match: (appointment: AppointmentView) => boolean
) {
  return appointments.filter(match).length;
}

export function buildAnalyticsReport(
  appointments: AppointmentView[],
  studentsCount: number
): AnalyticsReport {
  const total = appointments.length;
  const pending = countOf(appointments, (item) => item.status === "Pending");
  const confirmed = countOf(appointments, (item) => item.status === "Confirmed");
  const rescheduled = countOf(
    appointments,
    (item) => item.status === "Rescheduled"
  );
  const completed = countOf(appointments, (item) => item.status === "Completed");
  const online = countOf(appointments, (item) => item.mode === "Online");
  const inPerson = countOf(appointments, (item) => item.mode === "In-person");

  return {
    generatedAt: new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    studentsCount,
    total,
    summary: [
      {
        label: "Registered Students",
        value: studentsCount,
        description: "Students who created a PsyCheck account.",
      },
      {
        label: "Total Appointments",
        value: total,
        description: "All student requests submitted through PsyCheck.",
      },
      {
        label: "Online Appointments",
        value: online,
        description: "Requests booked as an online or video-call session.",
      },
      {
        label: "Pending",
        value: pending,
        description: "Requests still waiting for counselor review.",
      },
      {
        label: "Confirmed",
        value: confirmed,
        description: "Requests approved by a counselor or admin.",
      },
      {
        label: "Rescheduled",
        value: rescheduled,
        description: "Requests moved to a new follow-up schedule.",
      },
      {
        label: "Completed",
        value: completed,
        description: "Sessions that have already been finished.",
      },
    ],
    services: [
      {
        label: "Face to Face",
        value: countOf(
          appointments,
          (item) => item.appointmentType === "Face to Face"
        ),
      },
      {
        label: "Online",
        value: countOf(
          appointments,
          (item) => item.appointmentType === "Online"
        ),
      },
      {
        label: "Referral",
        value: countOf(
          appointments,
          (item) => item.appointmentType === "Referral"
        ),
      },
    ],
    yearLevels: [
      {
        label: "1st Year",
        value: countOf(appointments, (item) => item.yearLevel === "1st Year"),
      },
      {
        label: "2nd Year",
        value: countOf(appointments, (item) => item.yearLevel === "2nd Year"),
      },
      {
        label: "3rd Year",
        value: countOf(appointments, (item) => item.yearLevel === "3rd Year"),
      },
      {
        label: "4th Year",
        value: countOf(appointments, (item) => item.yearLevel === "4th Year"),
      },
    ],
    statuses: [
      { label: "Pending", value: pending },
      { label: "Confirmed", value: confirmed },
      { label: "Rescheduled", value: rescheduled },
      { label: "Completed", value: completed },
    ],
    modes: [
      { label: "Online / Video Call", value: online },
      { label: "In-person", value: inPerson },
    ],
    appointments,
  };
}

export function countRowsToValues(rows: CountRow[], total: number) {
  return rows.map((row) => [
    row.label,
    String(row.value),
    percent(row.value, total),
    row.description || "",
  ]);
}
