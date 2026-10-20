import { createUserClient } from "@/lib/supabase/user-client";
import { formatDisplayDate, formatDisplayTime } from "@/lib/types";
import {
  sendFollowUpScheduledEmail,
  sendSessionDoneEmail,
} from "@/lib/email";

type FollowUpBody = {
  appointmentId?: string;
  followUp?: boolean;
  date?: string;
  time?: string;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: FollowUpBody;

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

  try {
    if (body.followUp) {
      const date = body.date?.trim() || "";
      const time = body.time?.trim() || "";

      if (!date || !time) {
        return Response.json(
          { error: "Follow-up date and time are required." },
          { status: 400 }
        );
      }

      await sendFollowUpScheduledEmail({
        studentName: appointment.student_name,
        studentEmail: appointment.email,
        date: formatDisplayDate(date.slice(0, 10)),
        time: formatDisplayTime(time),
      });

      return Response.json({ ok: true, followUp: true });
    }

    await sendSessionDoneEmail({
      studentName: appointment.student_name,
      studentEmail: appointment.email,
    });

    return Response.json({ ok: true, followUp: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    return Response.json({ error: message }, { status: 500 });
  }
}
