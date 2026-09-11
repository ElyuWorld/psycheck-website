export const PARSU_STUDENT_EMAIL_SUFFIX = ".pbox@parsu.edu.ph";
export const PARSU_STUDENT_EMAIL_PATTERN =
  /^[a-z0-9._%+-]+\.pbox@parsu\.edu\.ph$/;
export const PARSU_STUDENT_EMAIL_HTML_PATTERN =
  "[A-Za-z0-9._%+\\-]+\\.pbox@parsu\\.edu\\.ph";

export function isParsuStudentEmail(value: string) {
  return PARSU_STUDENT_EMAIL_PATTERN.test(value.trim().toLowerCase());
}
