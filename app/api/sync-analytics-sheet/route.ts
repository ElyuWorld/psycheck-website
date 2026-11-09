import { createUserClient } from "@/lib/supabase/user-client";
import {
  buildAnalyticsReport,
  countRowsToValues,
} from "@/lib/analytics-report";
import { isKeptAppointment, isKeptStudent } from "@/lib/kept-records";
import { toAppointmentView } from "@/lib/types";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return Response.json(
      {
        error:
          "Google Sheets sync is not configured. Deploy google-apps-script/Code.gs as a web app, then add GOOGLE_SHEETS_WEBHOOK_URL.",
      },
      { status: 500 }
    );
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

  const [appointmentsRes, studentsRes] = await Promise.all([
    supabase.from("appointments").select("*").order("created_at", {
      ascending: false,
    }),
    supabase.from("profiles").select("*").eq("role", "student"),
  ]);

  if (appointmentsRes.error) {
    return Response.json({ error: appointmentsRes.error.message }, { status: 500 });
  }

  if (studentsRes.error) {
    return Response.json({ error: studentsRes.error.message }, { status: 500 });
  }

  const students = (studentsRes.data || []).filter(isKeptStudent);
  const appointments = (appointmentsRes.data || [])
    .filter((row) => isKeptAppointment(row, students))
    .map(toAppointmentView);

  const report = buildAnalyticsReport(appointments, students.length);

  const payload = {
    generatedAt: report.generatedAt,
    summary: countRowsToValues(report.summary, report.total),
    services: countRowsToValues(report.services, report.total),
    yearLevels: countRowsToValues(report.yearLevels, report.total),
    statuses: countRowsToValues(report.statuses, report.total),
    modes: countRowsToValues(report.modes, report.total),
    appointments: report.appointments.map((appointment) => [
      appointment.studentName,
      appointment.studentId,
      appointment.yearLevel,
      appointment.appointmentType,
      appointment.date,
      appointment.time,
      appointment.mode,
      appointment.status,
    ]),
  };

  const response = await postToAppsScript(webhookUrl, payload);

  const raw = await response.text();
  const looksLikeLogin =
    response.status === 401 ||
    response.status === 403 ||
    /accounts\.google\.com|Sign in/i.test(raw);

  if (looksLikeLogin) {
    return Response.json(
      {
        error:
          "The Apps Script web app is private. Create a new deployment: Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone (not Anyone with a Google account). Then paste the new /exec URL into GOOGLE_SHEETS_WEBHOOK_URL.",
      },
      { status: 502 }
    );
  }

  let body: { ok?: boolean; error?: string } = {};

  try {
    body = raw ? (JSON.parse(raw) as { ok?: boolean; error?: string }) : {};
  } catch {
    body = {};
  }

  if (!response.ok || body.ok === false || body.ok !== true) {
    return Response.json(
      {
        error:
          body.error ||
          "The Google Sheet could not be updated. Check the Apps Script web app deployment.",
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}

async function postToAppsScript(url: string, payload: unknown) {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "manual",
  };

  let response = await fetch(url, init);

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      response = await fetch(location, {
        ...init,
        redirect: "follow",
      });
    }
  }

  return response;
}
