import type { Profile } from "@/lib/types";

const DEMO_STUDENT_EMAILS = new Set([
  "juan@example.com",
  "maria@example.com",
  "john@example.com",
  "angela@example.com",
]);

const DEMO_STUDENT_NAMES = new Set([
  "juan dela cruz",
  "maria santos",
  "john reyes",
  "angela garcia",
]);

export function isKeptStudent(student: Profile) {
  const name = (student.full_name || "").trim();
  const email = (student.email || "").toLowerCase();

  if (name.toLowerCase() === "student 1") return true;
  if (!name) return false;
  if (DEMO_STUDENT_EMAILS.has(email)) return false;
  if (DEMO_STUDENT_NAMES.has(name.toLowerCase())) return false;
  if (!student.student_id?.trim()) return false;

  return true;
}

export function isKeptAppointment(
  row: { student_user_id: string | null; student_name: string; email: string },
  keptStudents: Profile[]
) {
  const email = (row.email || "").toLowerCase();
  const name = (row.student_name || "").trim().toLowerCase();

  if (DEMO_STUDENT_EMAILS.has(email)) return false;
  if (DEMO_STUDENT_NAMES.has(name)) return false;
  if (name === "student 1") return true;

  return keptStudents.some(
    (student) =>
      student.id === row.student_user_id ||
      student.email.toLowerCase() === email ||
      (student.full_name || "").trim().toLowerCase() === name
  );
}
