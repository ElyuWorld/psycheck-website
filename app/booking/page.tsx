"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SERVICE_LABELS,
  formatDisplayTime,
  type Availability,
} from "@/lib/types";
import {
  PARSU_STUDENT_EMAIL_HTML_PATTERN,
  PARSU_STUDENT_EMAIL_SUFFIX,
  isParsuStudentEmail,
} from "@/lib/parsu-email";

type StudentProfile = {
  fullName: string;
  studentId: string;
  email: string;
  yearLevel: string;
};

export default function BookingPage() {
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [service, setService] = useState("");
  const [referralName, setReferralName] = useState("");
  const [referralStudentNumber, setReferralStudentNumber] = useState("");
  const [referralGmail, setReferralGmail] = useState("");
  const [referralCause, setReferralCause] = useState("");
  const [slots, setSlots] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, student_id, email, year_level")
          .eq("id", user.id)
          .single();

        if (profile?.role === "counselor" || profile?.role === "admin") {
          router.replace("/admin-dashboard");
          return;
        }

        if (profileError || !profile) {
          setError(
            "Your account was found, but no student profile exists yet."
          );
          setCheckingAuth(false);
          return;
        }

        setUserId(user.id);
        setStudent({
          fullName: profile.full_name?.trim() || "Student",
          studentId: profile.student_id?.trim() || "",
          email: profile.email || user.email || "",
          yearLevel: profile.year_level || "",
        });

        const { data: availabilityData, error: availabilityError } =
          await supabase
            .from("availability")
            .select("*")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true });

        if (availabilityError) {
          setError(availabilityError.message);
        } else {
          setSlots(
            (availabilityData || [])
              .filter((slot) => slot.counselor_id)
              .map((slot) => ({
                ...slot,
                date: String(slot.date).slice(0, 10),
              }))
          );
        }

        setCheckingAuth(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
        );
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  const visibleSlots = useMemo(
    () => slots.filter((slot) => slotMatchesService(slot, service)),
    [slots, service]
  );

  const slotsForSelectedDate = useMemo(
    () => visibleSlots.filter((slot) => slot.date === selectedDate),
    [visibleSlots, selectedDate]
  );

  const selectedSlot =
    slotsForSelectedDate.find((slot) => slot.id === selectedSlotId) || null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEmailNotice("");
    setLoading(true);

    if (!student?.fullName) {
      setError("Your registered name could not be loaded. Please log in again.");
      setLoading(false);
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    const serviceValue = String(data.get("service") || service);
    const reason = String(data.get("reason") || "");
    const extraMessage = String(data.get("message") || "").trim();
    const referredName = String(data.get("referralName") || "").trim();
    const referredStudentNumber = String(
      data.get("referralStudentNumber") || ""
    ).trim();
    const referredGmail = String(data.get("referralGmail") || "")
      .trim()
      .toLowerCase();
    const referredCause = String(data.get("referralCause") || "").trim();

    if (!serviceValue || !reason) {
      setError("Please complete all required appointment fields.");
      setLoading(false);
      return;
    }

    if (!selectedSlot) {
      setError("Please choose an available date and time from the calendar.");
      setLoading(false);
      return;
    }

    if (serviceValue === "referral") {
      if (
        !referredName ||
        !referredStudentNumber ||
        !referredGmail ||
        !referredCause
      ) {
        setError("Please complete all referral fields.");
        setLoading(false);
        return;
      }

      if (!isParsuStudentEmail(referredGmail)) {
        setError(
          `Use the referred student's ParSU email ending in ${PARSU_STUDENT_EMAIL_SUFFIX}.`
        );
        setLoading(false);
        return;
      }
    }

    const appointmentType = SERVICE_LABELS[serviceValue] || serviceValue;
    const mode = selectedSlot.mode;
    const date = selectedSlot.date;
    const timeLabel = formatDisplayTime(selectedSlot.start_time);

    const referralNotes =
      serviceValue === "referral"
        ? [
            "Referral details:",
            `Name: ${referredName}`,
            `Student number: ${referredStudentNumber}`,
            `Gmail: ${referredGmail}`,
            `Cause of referring: ${referredCause}`,
          ].join("\n")
        : "";

    const combinedMessage = [referralNotes, extraMessage]
      .filter(Boolean)
      .join("\n\n");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in again before requesting an appointment.");
        setLoading(false);
        return;
      }

      const { data: created, error: insertError } = await supabase
        .from("appointments")
        .insert({
          student_user_id: user.id,
          student_name: student.fullName,
          student_id: student.studentId || "N/A",
          email: student.email,
          year_level: student.yearLevel || null,
          appointment_type: appointmentType,
          mode: mode === "Online" ? "Online" : "In-person",
          preferred_date: date,
          preferred_time: timeLabel,
          reason,
          message: combinedMessage || null,
          status: "Pending",
        })
        .select("id")
        .single();

      if (insertError || !created) {
        setError(insertError?.message || "Failed to submit appointment.");
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch("/api/notify-appointment-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({
            appointmentId: created.id,
            referral:
              serviceValue === "referral"
                ? {
                    name: referredName,
                    email: referredGmail,
                  }
                : undefined,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          referredEmailed?: boolean;
          referredEmailError?: string;
        };

        if (!response.ok) {
          setEmailNotice(
            payload.error ||
              "Your request was saved, but the confirmation email could not be sent."
          );
        } else if (payload.referredEmailError) {
          setEmailNotice(
            `A no-reply confirmation was sent to ${student.email}. The referred student email could not be sent.`
          );
        } else if (payload.referredEmailed) {
          setEmailNotice(
            `A no-reply confirmation was sent to ${student.email}, and a referral notice was sent to ${referredGmail}.`
          );
        } else {
          setEmailNotice(
            `A no-reply confirmation was sent to ${student.email}.`
          );
        }
      } catch {
        setEmailNotice(
          "Your request was saved, but the confirmation email could not be sent."
        );
      }

      form.reset();
      setService("");
      setReferralName("");
      setReferralStudentNumber("");
      setReferralGmail("");
      setReferralCause("");
      setSelectedDate("");
      setSelectedSlotId("");
      setShowAlert(true);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Failed to submit appointment.";
      setError(messageText);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Loading booking form...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full border-b border-gray-100 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={55}
              height={55}
              priority
              className="object-contain"
            />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-[#087f3e]">PsyCheck</h1>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {student && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {student.fullName}
                </p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            )}

            {student && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#087f3e] text-sm font-semibold text-white">
                {student.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <Link
              href="/"
              className="rounded-lg border border-[#087f3e] px-4 py-2.5 text-sm font-medium text-[#087f3e] transition hover:bg-green-50"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-[#087f3e] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <section className="bg-[#f7faf8] px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-gray-900">
              Book an Appointment
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
              {student
                ? `Welcome, ${student.fullName}. Your registered name is already on this request.`
                : "Schedule a psychosocial support appointment with our team."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form className="space-y-7" onSubmit={handleSubmit}>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Student Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This information was taken from your PsyCheck registration.
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#087f3e]">
                  Logged in as
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {student?.fullName || "Student"}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Student ID</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {student?.studentId || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="mt-1 break-all text-sm font-medium text-gray-800">
                      {student?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Year Level</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {student?.yearLevel || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-7">
                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment Details
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose your preferred appointment schedule.
                </p>
              </div>

              <div>
                <label
                  htmlFor="service"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Type of Appointment
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  value={service}
                  onChange={(e) => {
                    const next = e.target.value;
                    setService(next);
                    setSelectedDate("");
                    setSelectedSlotId("");
                    if (next !== "referral") {
                      setReferralName("");
                      setReferralStudentNumber("");
                      setReferralGmail("");
                      setReferralCause("");
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                >
                  <option value="" disabled>
                    Select appointment type
                  </option>
                  <option value="counseling">Counseling Session</option>
                  <option value="referral">Referral</option>
                  <option value="online">Online Appointment</option>
                </select>
              </div>

              {service === "referral" && (
                <div className="space-y-5 rounded-xl border border-green-100 bg-green-50 p-5">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">
                      Referral Information
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Fill this out only for the student you are referring.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="referralName"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <input
                        id="referralName"
                        name="referralName"
                        type="text"
                        required
                        value={referralName}
                        onChange={(e) => setReferralName(e.target.value)}
                        placeholder="Enter the student's name"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="referralStudentNumber"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Student Number
                      </label>
                      <input
                        id="referralStudentNumber"
                        name="referralStudentNumber"
                        type="text"
                        required
                        value={referralStudentNumber}
                        onChange={(e) =>
                          setReferralStudentNumber(e.target.value)
                        }
                        placeholder="Enter student number"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="referralGmail"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Gmail
                    </label>
                    <input
                      id="referralGmail"
                      name="referralGmail"
                      type="email"
                      required
                      value={referralGmail}
                      onChange={(e) => setReferralGmail(e.target.value)}
                      placeholder={`juan.delacruz${PARSU_STUDENT_EMAIL_SUFFIX}`}
                      pattern={PARSU_STUDENT_EMAIL_HTML_PATTERN}
                      title={`Must end with ${PARSU_STUDENT_EMAIL_SUFFIX}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Required format: yourname{PARSU_STUDENT_EMAIL_SUFFIX}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="referralCause"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Cause of Referring
                    </label>
                    <textarea
                      id="referralCause"
                      name="referralCause"
                      required
                      rows={3}
                      value={referralCause}
                      onChange={(e) => setReferralCause(e.target.value)}
                      placeholder="Explain why this student is being referred..."
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Schedule
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a date and time posted by a counselor. Unavailable
                  dates cannot be selected.
                </p>
              </div>

              {visibleSlots.length === 0 ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {slots.length === 0
                    ? "No counselor schedules are posted yet. Please check back later."
                    : "No available dates for this appointment type. Try another type, or wait for a counselor to add a matching schedule."}
                </div>
              ) : (
                <BookingCalendar
                  availableDates={
                    new Set(visibleSlots.map((slot) => slot.date))
                  }
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedSlotId("");
                  }}
                />
              )}

              {selectedDate && (
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Available times for{" "}
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>

                  {slotsForSelectedDate.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No times are available on this date.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slotsForSelectedDate.map((slot) => {
                        const label = `${formatDisplayTime(slot.start_time)} – ${formatDisplayTime(slot.end_time)}`;
                        const active = selectedSlotId === slot.id;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                              active
                                ? "border-[#087f3e] bg-[#087f3e] text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-[#087f3e] hover:bg-green-50"
                            }`}
                          >
                            {label}
                            <span className="mt-1 block text-[11px] font-normal opacity-80">
                              {slot.appointment_type} · {slot.mode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-[#087f3e]">
                  Selected: {formatDisplayTime(selectedSlot.start_time)} –{" "}
                  {formatDisplayTime(selectedSlot.end_time)} ({selectedSlot.mode}
                  )
                </div>
              )}

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Reason for Appointment
                </label>
                <select
                  id="reason"
                  name="reason"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  <option value="academic">Academic Concerns</option>
                  <option value="personal">Personal Concerns</option>
                  <option value="relationships">
                    Relationship / Social Concerns
                  </option>
                  <option value="general">General Consultation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Additional Information
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="You may provide additional information about your appointment..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs leading-5 text-gray-600">
                  Your information should only be collected and handled according
                  to your institution&apos;s privacy policies and applicable
                  data-protection requirements.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end border-t border-gray-100 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#087f3e] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#066b34] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Submitting..." : "Request Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-[#087f3e]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-gray-900">
              Your Appointment was Submitted
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {student
                ? `Thanks, ${student.fullName}. Your appointment request has been saved.`
                : "Your appointment request has been saved to the PsyCheck database."}{" "}
              Please wait for the administrator to review your request.
            </p>

            {emailNotice && (
              <p className="mt-3 text-sm leading-6 text-gray-500">
                {emailNotice}
              </p>
            )}

            <div className="mt-5 rounded-lg bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-[#087f3e]">
                Appointment Status: Pending
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAlert(false)}
              className="mt-6 w-full rounded-lg bg-[#087f3e] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function slotMatchesService(slot: Availability, service: string) {
  if (!service) return true;

  const label = SERVICE_LABELS[service];

  if (service === "online") {
    return (
      slot.mode === "Online" || slot.appointment_type === "Online Appointment"
    );
  }

  return slot.appointment_type === label;
}

function BookingCalendar({
  availableDates,
  selectedDate,
  onSelectDate,
}: {
  availableDates: Set<string>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cursor, setCursor] = useState(() => {
    const firstAvailable = [...availableDates].sort()[0];
    if (firstAvailable) {
      const [year, month] = firstAvailable.split("-").map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean } | null> =
    [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ date, day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-10 sm:h-11" />;
          }

          const available = availableDates.has(cell.date);
          const selected = selectedDate === cell.date;
          const isPast = new Date(`${cell.date}T00:00:00`) < today;
          const clickable = available && !isPast;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!clickable}
              onClick={() => onSelectDate(cell.date)}
              className={`h-10 rounded-xl text-sm font-medium transition sm:h-11 ${
                selected
                  ? "bg-[#087f3e] text-white"
                  : clickable
                    ? "bg-green-50 text-[#087f3e] hover:bg-green-100"
                    : "cursor-not-allowed text-gray-300"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-50 ring-1 ring-[#087f3e]" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#087f3e]" />
          Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-gray-100" />
          Unavailable
        </span>
      </div>
    </div>
  );
}
