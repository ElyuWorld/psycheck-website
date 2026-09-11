export type UserRole = "student" | "counselor" | "admin";

export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export type AppointmentMode = "Online" | "In-person";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  student_id: string | null;
  year_level: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  student_user_id: string | null;
  student_name: string;
  student_id: string;
  email: string;
  year_level: string | null;
  appointment_type: string;
  mode: AppointmentMode;
  preferred_date: string;
  preferred_time: string;
  reason: string | null;
  message: string | null;
  status: AppointmentStatus;
  meeting_link: string | null;
  created_at: string;
};

export type Availability = {
  id: string;
  counselor_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  mode: AppointmentMode;
  created_at: string;
};

/** UI-friendly appointment shape used by the admin dashboard */
export type AppointmentView = {
  id: string;
  studentName: string;
  studentId: string;
  email: string;
  yearLevel: string;
  appointmentType: string;
  mode: AppointmentMode;
  date: string;
  time: string;
  status: AppointmentStatus;
  meetingLink: string;
  reason: string;
  message: string;
};

/** UI-friendly availability shape used by the admin dashboard */
export type AvailabilityView = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  mode: AppointmentMode;
};

export function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function parseClockTime(value: string) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const match = text.includes("T")
    ? text.match(/T(\d{2}):(\d{2})/)
    : text.match(/(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

export function toClockValue(value: string) {
  const parsed = parseClockTime(value);
  if (!parsed) return value;

  return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}:00`;
}

export function formatDisplayTime(value: string) {
  const parsed = parseClockTime(value);
  if (!parsed) return String(value ?? "");

  const period = parsed.hour >= 12 ? "PM" : "AM";
  const displayHour = parsed.hour % 12 || 12;

  return `${displayHour}:${String(parsed.minute).padStart(2, "0")} ${period}`;
}

export function clockToMinutes(value: string) {
  const parsed = parseClockTime(value);
  if (!parsed) return null;
  return parsed.hour * 60 + parsed.minute;
}

export const AVAILABILITY_TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export function toAppointmentView(row: Appointment): AppointmentView {
  return {
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    email: row.email,
    yearLevel: row.year_level || "N/A",
    appointmentType: row.appointment_type,
    mode: row.mode,
    date: formatDisplayDate(row.preferred_date),
    time: row.preferred_time,
    status: row.status,
    meetingLink: row.meeting_link || "",
    reason: row.reason || "",
    message: row.message || "",
  };
}

export function toAvailabilityView(row: Availability): AvailabilityView {
  return {
    id: row.id,
    date: formatDisplayDate(String(row.date).slice(0, 10)),
    startTime: formatDisplayTime(row.start_time),
    endTime: formatDisplayTime(row.end_time),
    appointmentType: row.appointment_type,
    mode: row.mode,
  };
}

export const SERVICE_LABELS: Record<string, string> = {
  counseling: "Counseling Session",
  referral: "Referral",
  online: "Online Appointment",
};
