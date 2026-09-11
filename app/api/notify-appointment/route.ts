import { createUserClient } from "@/lib/supabase/user-client";
import { formatDisplayDate } from "@/lib/types";
import { sendAppointmentApprovedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { appointmentId?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const appointmentId = body.appointmentId?.trim();

  if (!appointmentId) {
    return Response.json({ error: "Missing appointment id" }, { status: 400 });
  }

  const supabase = createUserClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    (profile.role !== "counselor" && profile.role !== "admin")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single();

  if (appointmentError || !appointment) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.status !== "Confirmed") {
    return Response.json(
      { error: "Email is sent only after an appointment is approved." },
      { status: 400 }
    );
  }

  try {
    await sendAppointmentApprovedEmail({
      studentName: appointment.student_name,
      studentEmail: appointment.email,
      appointmentType: appointment.appointment_type,
      date: formatDisplayDate(String(appointment.preferred_date).slice(0, 10)),
      time: appointment.preferred_time,
      mode: appointment.mode,
      meetingLink: appointment.meeting_link || undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
