"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  toAppointmentView,
  toAvailabilityView,
  AVAILABILITY_TIME_OPTIONS,
  clockToMinutes,
  formatDisplayTime,
  toClockValue,
  type AppointmentMode,
  type AppointmentStatus,
  type AppointmentView,
  type AvailabilityView,
  type Profile,
} from "@/lib/types";

type Tab =
  | "dashboard"
  | "students"
  | "availability"
  | "appointments"
  | "analytics";

type Appointment = AppointmentView;
type Availability = AvailabilityView;
type Student = Profile;

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

function isKeptStudent(student: Profile) {
  const name = (student.full_name || "").trim();
  const email = (student.email || "").toLowerCase();

  if (name.toLowerCase() === "student 1") return true;
  if (!name) return false;
  if (DEMO_STUDENT_EMAILS.has(email)) return false;
  if (DEMO_STUDENT_NAMES.has(name.toLowerCase())) return false;
  if (!student.student_id?.trim()) return false;

  return true;
}

function isKeptAppointment(
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

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<Tab>("dashboard");

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [availability, setAvailability] =
    useState<Availability[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [studentSearch, setStudentSearch] = useState("");

  const [search, setSearch] = useState("");

  const [showAppointment, setShowAppointment] =
    useState<Appointment | null>(null);

  function selectTab(tab: Tab) {
    setShowAppointment(null);
    setActiveTab(tab);
  }

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [staffName, setStaffName] = useState("Administrator");
  const [staffUserId, setStaffUserId] = useState<string | null>(null);

  // Schedule form
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [appointmentType, setAppointmentType] =
    useState("Counseling Session");

  const [mode, setMode] =
    useState<AppointmentMode>("Online");

  // ============================================================
  // LOGIN PROTECTION + SUPABASE DATA
  // ============================================================

  useEffect(() => {
    async function init() {
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
          .select("role, full_name, email")
          .eq("id", user.id)
          .single();

        if (
          profileError ||
          !profile ||
          (profile.role !== "counselor" && profile.role !== "admin")
        ) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setStaffUserId(user.id);
        setStaffName(
          profile.full_name ||
            (profile.role === "admin" ? "Administrator" : "Counselor")
        );

        await loadData();
      } catch (err) {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Unable to connect to Supabase. Check .env.local"
        );
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function loadData() {
    const supabase = createClient();

    const [appointmentsRes, availabilityRes, studentsRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("availability")
        .select("*")
        .order("date", { ascending: true }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false }),
    ]);

    if (appointmentsRes.error) {
      setLoadError(appointmentsRes.error.message);
      setLoading(false);
      return;
    }

    if (availabilityRes.error) {
      setLoadError(availabilityRes.error.message);
      setLoading(false);
      return;
    }

    if (studentsRes.error) {
      setLoadError(studentsRes.error.message);
      setLoading(false);
      return;
    }

    const registeredStudents = (studentsRes.data || []).filter(isKeptStudent);

    setAppointments(
      (appointmentsRes.data || [])
        .filter((row) => isKeptAppointment(row, registeredStudents))
        .map(toAppointmentView)
    );
    setAvailability(
      (availabilityRes.data || [])
        .filter((row) => row.counselor_id)
        .map(toAvailabilityView)
    );
    setStudents(registeredStudents);
    setLoadError("");
    setLoading(false);
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  async function createSchedule() {
    if (!date || !startTime || !endTime) {
      setMessage("Please complete all schedule fields.");
      return;
    }

    const startMinutes = clockToMinutes(startTime);
    const endMinutes = clockToMinutes(endTime);

    if (
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      setMessage("End time must be later than the start time.");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please log in again before adding availability.");
        return;
      }

      const { error } = await supabase.from("availability").insert({
        counselor_id: user.id,
        date,
        start_time: toClockValue(startTime),
        end_time: toClockValue(endTime),
        appointment_type: appointmentType,
        mode,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setDate("");
      setStartTime("");
      setEndTime("");
      setMessage("Availability successfully added.");
      await loadData();

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to add availability."
      );
    }
  }

  async function removeSchedule(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", id);

      if (error) {
        setMessage(error.message);
        return;
      }

      await loadData();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to remove availability."
      );
    }
  }

  async function updateStatus(
    id: string,
    status: AppointmentStatus
  ) {
    const previous = appointments.find(
      (appointment) => appointment.id === id
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) {
        setMessage(error.message);
        return;
      }

      const updated = appointments.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              status,
            }
          : appointment
      );

      setAppointments(updated);

      if (showAppointment?.id === id) {
        setShowAppointment(
          updated.find((appointment) => appointment.id === id) || null
        );
      }

      if (status === "Confirmed" && previous?.status !== "Confirmed") {
        const appointment = updated.find((item) => item.id === id);

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const response = await fetch("/api/notify-appointment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token || ""}`,
            },
            body: JSON.stringify({ appointmentId: id }),
          });

          const payload = (await response.json()) as { error?: string };

          if (!response.ok) {
            setMessage(
              payload.error ||
                "Appointment approved, but the student email could not be sent."
            );
            return;
          }

          setMessage(
            `Appointment approved. A no-reply email was sent to ${appointment?.email || "the student"}.`
          );
        } catch {
          setMessage(
            "Appointment approved, but the student email could not be sent."
          );
        }

        setTimeout(() => {
          setMessage("");
        }, 4000);
      }
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  }

  async function saveMeetingLink(
    id: string,
    link: string
  ) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({ meeting_link: link })
        .eq("id", id);

      if (error) {
        setMessage(error.message);
        return;
      }

      const updated = appointments.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              meetingLink: link,
            }
          : appointment
      );

      setAppointments(updated);

      if (showAppointment?.id === id) {
        setShowAppointment(
          updated.find((appointment) => appointment.id === id) || null
        );
      }

      setMessage("Video call link saved.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save meeting link."
      );
    }
  }

  const pending = appointments.filter(
    (a) => a.status === "Pending"
  ).length;

  const confirmed = appointments.filter(
    (a) => a.status === "Confirmed"
  ).length;

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();

    if (!query) return students;

    return students.filter((student) => {
      return (
        (student.full_name || "").toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.student_id || "").toLowerCase().includes(query) ||
        (student.year_level || "").toLowerCase().includes(query)
      );
    });
  }, [students, studentSearch]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const query = search.toLowerCase();

      return (
        appointment.studentName
          .toLowerCase()
          .includes(query) ||
        appointment.studentId
          .toLowerCase()
          .includes(query) ||
        appointment.appointmentType
          .toLowerCase()
          .includes(query)
      );
    });
  }, [appointments, search]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf8]">
        <p className="text-sm text-gray-500">
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Supabase connection needed
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {loadError}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Follow the steps in <code>supabase/README.md</code>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-[#087f3e] px-5 py-2.5 text-sm font-medium text-white"
          >
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-gray-900">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">

        <div className="flex h-20 items-center justify-between px-5 md:px-8">

          <Link
            href="/"
            className="flex items-center"
          >

            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={50}
              height={50}
              priority
              className="object-contain"
            />

            <div className="ml-3">

              <h1 className="font-semibold text-[#087f3e]">
                PsyCheck
              </h1>

              <p className="text-xs text-gray-500">
                Admin Portal
              </p>

            </div>

          </Link>


          <div className="flex items-center gap-4">

            <div className="hidden text-right md:block">

              <p className="text-sm font-semibold">
                {staffName}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#087f3e] font-semibold text-white">
              A
            </div>

            <button
              onClick={handleLogout}
              className="hidden rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:text-red-500 md:block"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      <div className="mx-auto flex max-w-[1500px]">


        {/* SIDEBAR */}

        <aside className="hidden min-h-[calc(100vh-80px)] w-64 border-r border-gray-200 bg-white p-5 md:block">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Administration
          </p>


          <NavButton
            active={activeTab === "dashboard"}
            onClick={() => selectTab("dashboard")}
          >
            <DashboardIcon />
            Dashboard
          </NavButton>


          <NavButton
            active={activeTab === "students"}
            onClick={() => selectTab("students")}
          >
            <StudentsIcon />
            Students

            {students.length > 0 && (
              <span className="ml-auto rounded-full bg-green-100 px-2 py-1 text-[10px] text-green-700">
                {students.length}
              </span>
            )}
          </NavButton>


          <NavButton
            active={activeTab === "availability"}
            onClick={() =>
              selectTab("availability")
            }
          >
            <CalendarIcon />
            My Availability
          </NavButton>


          <NavButton
            active={activeTab === "appointments"}
            onClick={() =>
              selectTab("appointments")
            }
          >
            <AppointmentIcon />
            Appointments

            {pending > 0 && (
              <span className="ml-auto rounded-full bg-yellow-100 px-2 py-1 text-[10px] text-yellow-700">
                {pending}
              </span>
            )}

          </NavButton>


          <NavButton
            active={activeTab === "analytics"}
            onClick={() =>
              selectTab("analytics")
            }
          >
            <ChartIcon />
            Student Analytics
          </NavButton>


          <div className="my-6 border-t border-gray-100" />


          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <HomeIcon />
            Back to Website
          </Link>

        </aside>


        {/* MAIN */}

        <section className="min-w-0 flex-1 p-5 md:p-8">

          {showAppointment && (
            <AppointmentDetails
              key={showAppointment.id}
              appointment={showAppointment}
              onClose={() => setShowAppointment(null)}
              onStatusChange={updateStatus}
              onSaveMeetingLink={saveMeetingLink}
            />
          )}


          {/* DASHBOARD */}

          {!showAppointment && activeTab === "dashboard" && (

            <div>

              <PageHeader
                title="Dashboard"
                description="Manage student appointments, availability, and service activity."
              />


              {/* STATISTICS */}

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                  title="Registered Students"
                  value={students.length}
                  icon={<StudentsIcon />}
                />

                <StatCard
                  title="Total Appointments"
                  value={appointments.length}
                  icon={<CalendarIcon />}
                />

                <StatCard
                  title="Pending Requests"
                  value={pending}
                  icon={<ClockIcon />}
                />

                <StatCard
                  title="Confirmed"
                  value={confirmed}
                  icon={<CheckIcon />}
                />

              </div>


              {/* DASHBOARD GRID */}

              <div className="mt-7 grid gap-6 xl:grid-cols-3">


                {/* APPOINTMENTS */}

                <div className="rounded-xl border border-gray-200 bg-white xl:col-span-2">

                  <div className="flex items-center justify-between border-b border-gray-100 p-6">

                    <div>

                      <h2 className="font-semibold">
                        Recent Appointments
                      </h2>

                      <p className="mt-1 text-xs text-gray-500">
                        Latest student appointment requests
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        selectTab("appointments")
                      }
                      className="text-xs font-medium text-[#087f3e] hover:underline"
                    >
                      View all
                    </button>

                  </div>


                  <div className="divide-y divide-gray-100">

                    {appointments
                      .slice(0, 5)
                      .map((appointment) => (

                        <button
                          key={appointment.id}
                          onClick={() =>
                            setShowAppointment(
                              appointment
                            )
                          }
                          className="flex w-full items-center gap-4 p-5 text-left hover:bg-gray-50"
                        >

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 font-semibold text-[#087f3e]">
                            {appointment.studentName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-semibold">
                              {appointment.studentName}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {appointment.appointmentType}
                            </p>

                          </div>

                          <div className="hidden text-right sm:block">

                            <p className="text-xs font-medium">
                              {appointment.date}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {appointment.time}
                            </p>

                          </div>

                          <StatusBadge
                            status={appointment.status}
                          />

                        </button>

                      ))}

                  </div>

                </div>


                {/* QUICK ACTIONS */}

                <div className="rounded-xl border border-gray-200 bg-white p-6">

                  <h2 className="font-semibold">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Common administrative actions
                  </p>


                  <div className="mt-6 space-y-3">

                    <button
                      onClick={() =>
                        selectTab("students")
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-4 text-left hover:bg-green-50"
                    >

                      <StudentsIcon />

                      <div>

                        <p className="text-sm font-medium">
                          View Students
                        </p>

                        <p className="text-xs text-gray-500">
                          {students.length} registered student(s)
                        </p>

                      </div>

                    </button>


                    <button
                      onClick={() =>
                        selectTab("availability")
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-4 text-left hover:bg-green-50"
                    >

                      <CalendarIcon />

                      <div>

                        <p className="text-sm font-medium">
                          Add Availability
                        </p>

                        <p className="text-xs text-gray-500">
                          Create an appointment slot
                        </p>

                      </div>

                    </button>


                    <button
                      onClick={() =>
                        selectTab("appointments")
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-4 text-left hover:bg-green-50"
                    >

                      <AppointmentIcon />

                      <div>

                        <p className="text-sm font-medium">
                          Review Requests
                        </p>

                        <p className="text-xs text-gray-500">
                          {pending} pending request(s)
                        </p>

                      </div>

                    </button>


                    <button
                      onClick={() =>
                        selectTab("analytics")
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-4 text-left hover:bg-green-50"
                    >

                      <ChartIcon />

                      <div>

                        <p className="text-sm font-medium">
                          View Analytics
                        </p>

                        <p className="text-xs text-gray-500">
                          Review student appointment data
                        </p>

                      </div>

                    </button>

                  </div>

                </div>

              </div>


              {/* NOTICE */}

              <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5">

                <p className="text-sm font-semibold text-[#087f3e]">
                  Connected to Supabase
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  Appointments, availability, and meeting links
                  are stored in your Supabase Postgres database
                  and shared across student and staff devices.
                </p>

              </div>

            </div>

          )}


          {/* STUDENTS */}

          {!showAppointment && activeTab === "students" && (

            <div>

              <PageHeader
                title="Registered Students"
                description="Students who created an account through the PsyCheck registration form."
              />

              <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

                <input
                  value={studentSearch}
                  onChange={(e) =>
                    setStudentSearch(e.target.value)
                  }
                  placeholder="Search name, email, student ID, or year level..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087f3e]"
                />

              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[800px]">

                    <thead className="border-b border-gray-100 bg-gray-50">

                      <tr>

                        <TableHead>
                          Student
                        </TableHead>

                        <TableHead>
                          Student ID
                        </TableHead>

                        <TableHead>
                          Year Level
                        </TableHead>

                        <TableHead>
                          Email
                        </TableHead>

                        <TableHead>
                          Registered
                        </TableHead>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {filteredStudents.length === 0 && (

                        <tr>

                          <td
                            colSpan={5}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No registered students yet. New student
                            accounts from the login Register tab will
                            appear here.
                          </td>

                        </tr>

                      )}

                      {filteredStudents.map((student) => (

                        <tr
                          key={student.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 font-semibold text-[#087f3e]">
                                {(student.full_name || student.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <p className="text-sm font-semibold">
                                {student.full_name || "Unnamed student"}
                              </p>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-700">
                            {student.student_id || "—"}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-700">
                            {student.year_level || "—"}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-700">
                            {student.email}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {new Date(student.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          )}


          {/* AVAILABILITY */}

          {!showAppointment && activeTab === "availability" && (

            <div>

              <PageHeader
                title="My Availability"
                description="Set the dates and times when students can request an appointment."
              />


              <div className="grid gap-6 xl:grid-cols-3">


                {/* FORM */}

                <div className="rounded-xl border border-gray-200 bg-white p-6 xl:col-span-1">

                  <h2 className="font-semibold">
                    Create Availability
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Students can choose from these available slots.
                  </p>


                  {message && (
                    <div className="mt-5 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                      {message}
                    </div>
                  )}


                  <div className="mt-6 space-y-5">

                    <Field label="Date">

                      <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                          setDate(e.target.value)
                        }
                        className="input"
                      />

                    </Field>


                    <div className="grid grid-cols-2 gap-3">

                      <Field label="Start">

                        <select
                          value={startTime}
                          onChange={(e) =>
                            setStartTime(e.target.value)
                          }
                          className="input"
                        >
                          <option value="">
                            Select time
                          </option>
                          {AVAILABILITY_TIME_OPTIONS.map((time) => (
                            <option key={`start-${time}`} value={time}>
                              {formatDisplayTime(time)}
                            </option>
                          ))}
                        </select>

                      </Field>


                      <Field label="End">

                        <select
                          value={endTime}
                          onChange={(e) =>
                            setEndTime(e.target.value)
                          }
                          className="input"
                        >
                          <option value="">
                            Select time
                          </option>
                          {AVAILABILITY_TIME_OPTIONS.map((time) => (
                            <option key={`end-${time}`} value={time}>
                              {formatDisplayTime(time)}
                            </option>
                          ))}
                        </select>

                      </Field>

                    </div>


                    <Field label="Appointment Type">

                      <select
                        value={appointmentType}
                        onChange={(e) =>
                          setAppointmentType(
                            e.target.value
                          )
                        }
                        className="input"
                      >

                        <option>
                          Counseling Session
                        </option>

                        <option>
                          Referral
                        </option>

                        <option>
                          Online Appointment
                        </option>

                      </select>

                    </Field>


                    <Field label="Appointment Mode">

                      <select
                        value={mode}
                        onChange={(e) =>
                          setMode(
                            e.target.value as AppointmentMode
                          )
                        }
                        className="input"
                      >

                        <option value="Online">
                          Online / Video Call
                        </option>

                        <option value="In-person">
                          In-person
                        </option>

                      </select>

                    </Field>


                    <button
                      onClick={createSchedule}
                      className="w-full rounded-lg bg-[#087f3e] py-3 text-sm font-medium text-white hover:bg-[#066b34]"
                    >
                      + Add Availability
                    </button>

                  </div>

                </div>


                {/* AVAILABILITY LIST */}

                <div className="rounded-xl border border-gray-200 bg-white xl:col-span-2">

                  <div className="border-b border-gray-100 p-6">

                    <h2 className="font-semibold">
                      Your Available Slots
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      These are the schedules students can request.
                    </p>

                  </div>


                  <div className="divide-y divide-gray-100">

                    {availability.map((slot) => (

                      <div
                        key={slot.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-5"
                      >

                        <div>

                          <p className="text-sm font-semibold">
                            {slot.date}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {slot.startTime} – {slot.endTime}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">

                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] text-green-700">
                              {slot.appointmentType}
                            </span>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                              {slot.mode}
                            </span>

                          </div>

                        </div>


                        <button
                          onClick={() =>
                            removeSchedule(slot.id)
                          }
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                        >
                          Remove
                        </button>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          )}


          {/* APPOINTMENTS */}

          {!showAppointment && activeTab === "appointments" && (

            <div>

              <PageHeader
                title="Appointments"
                description="Review student requests and manage online appointments."
              />


              {/* SEARCH */}

              <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search student name, ID, or appointment type..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087f3e]"
                />

              </div>


              {/* TABLE */}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[950px]">

                    <thead className="border-b border-gray-100 bg-gray-50">

                      <tr>

                        <TableHead>
                          Student
                        </TableHead>

                        <TableHead>
                          Appointment
                        </TableHead>

                        <TableHead>
                          Date / Time
                        </TableHead>

                        <TableHead>
                          Mode
                        </TableHead>

                        <TableHead>
                          Status
                        </TableHead>

                        <TableHead>
                          Action
                        </TableHead>

                      </tr>

                    </thead>


                    <tbody className="divide-y divide-gray-100">

                      {filteredAppointments.map(
                        (appointment) => (

                          <tr
                            key={appointment.id}
                            className="hover:bg-gray-50"
                          >

                            <td className="px-6 py-5">

                              <p className="text-sm font-semibold">
                                {appointment.studentName}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {appointment.studentId}
                              </p>

                            </td>


                            <td className="px-6 py-5">

                              <p className="text-sm">
                                {appointment.appointmentType}
                              </p>

                            </td>


                            <td className="px-6 py-5">

                              <p className="text-sm">
                                {appointment.date}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {appointment.time}
                              </p>

                            </td>


                            <td className="px-6 py-5">

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                {appointment.mode}
                              </span>

                            </td>


                            <td className="px-6 py-5">

                              <StatusBadge
                                status={appointment.status}
                              />

                            </td>


                            <td className="px-6 py-5">

                              <button
                                onClick={() =>
                                  setShowAppointment(
                                    appointment
                                  )
                                }
                                className="rounded-lg bg-[#087f3e] px-3 py-2 text-xs font-medium text-white hover:bg-[#066b34]"
                              >
                                Manage
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          )}


          {/* ANALYTICS */}

          {!showAppointment && activeTab === "analytics" && (

            <Analytics
              appointments={appointments}
            />

          )}

        </section>

      </div>


      {message && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border border-green-100 bg-white px-4 py-3 text-sm text-green-800 shadow-lg">
          {message}
        </div>
      )}


    </main>
  );
}


/* ============================================================
   ANALYTICS
============================================================ */

function Analytics({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const total = appointments.length;

  const online = appointments.filter(
    (a) => a.mode === "Online"
  ).length;

  const pending = appointments.filter(
    (a) => a.status === "Pending"
  ).length;

  const completed = appointments.filter(
    (a) => a.status === "Completed"
  ).length;

  const counseling = appointments.filter(
    (a) =>
      a.appointmentType ===
      "Counseling Session"
  ).length;

  const referral = appointments.filter(
    (a) => a.appointmentType === "Referral"
  ).length;

  const onlineType = appointments.filter(
    (a) =>
      a.appointmentType ===
      "Online Appointment"
  ).length;

  const firstYear = appointments.filter(
    (a) => a.yearLevel === "1st Year"
  ).length;

  const secondYear = appointments.filter(
    (a) => a.yearLevel === "2nd Year"
  ).length;

  const thirdYear = appointments.filter(
    (a) => a.yearLevel === "3rd Year"
  ).length;

  const fourthYear = appointments.filter(
    (a) => a.yearLevel === "4th Year"
  ).length;

  return (

    <div>

      <PageHeader
        title="Student Analytics"
        description="View aggregated appointment information submitted by students."
      />


      {/* TOP CARDS */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Appointments"
          value={total}
          icon={<CalendarIcon />}
        />

        <StatCard
          title="Online Appointments"
          value={online}
          icon={<VideoIcon />}
        />

        <StatCard
          title="Pending"
          value={pending}
          icon={<ClockIcon />}
        />

        <StatCard
          title="Completed"
          value={completed}
          icon={<CheckIcon />}
        />

      </div>


      <div className="mt-7 grid gap-6 lg:grid-cols-2">


        {/* APPOINTMENT TYPES */}

        <AnalyticsCard
          title="Appointment Types"
          description="What services students requested"
        >

          <Progress
            label="Counseling Session"
            value={counseling}
            total={total}
          />

          <Progress
            label="Referral"
            value={referral}
            total={total}
          />

          <Progress
            label="Online Appointment"
            value={onlineType}
            total={total}
          />

        </AnalyticsCard>


        {/* YEAR LEVEL */}

        <AnalyticsCard
          title="Students by Year Level"
          description="Distribution of students who booked"
        >

          <Progress
            label="1st Year"
            value={firstYear}
            total={total}
          />

          <Progress
            label="2nd Year"
            value={secondYear}
            total={total}
          />

          <Progress
            label="3rd Year"
            value={thirdYear}
            total={total}
          />

          <Progress
            label="4th Year"
            value={fourthYear}
            total={total}
          />

        </AnalyticsCard>


        {/* STATUS */}

        <AnalyticsCard
          title="Appointment Status"
          description="Current appointment outcomes"
        >

          <Progress
            label="Pending"
            value={
              appointments.filter(
                (a) => a.status === "Pending"
              ).length
            }
            total={total}
          />

          <Progress
            label="Confirmed"
            value={
              appointments.filter(
                (a) => a.status === "Confirmed"
              ).length
            }
            total={total}
          />

          <Progress
            label="Completed"
            value={
              appointments.filter(
                (a) => a.status === "Completed"
              ).length
            }
            total={total}
          />

          <Progress
            label="Cancelled"
            value={
              appointments.filter(
                (a) => a.status === "Cancelled"
              ).length
            }
            total={total}
          />

        </AnalyticsCard>


        {/* MODE */}

        <AnalyticsCard
          title="Appointment Mode"
          description="How students prefer to attend"
        >

          <Progress
            label="Online / Video Call"
            value={
              appointments.filter(
                (a) => a.mode === "Online"
              ).length
            }
            total={total}
          />

          <Progress
            label="In-person"
            value={
              appointments.filter(
                (a) => a.mode === "In-person"
              ).length
            }
            total={total}
          />

        </AnalyticsCard>

      </div>


      <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5">

        <p className="text-sm font-semibold text-[#087f3e]">
          Analytics privacy note
        </p>

        <p className="mt-1 text-xs leading-5 text-green-700">
          This dashboard currently summarizes appointment
          information such as appointment type, year level,
          status, and appointment mode. When the real
          database is added, access to student information
          should be restricted to authorized personnel.
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   APPOINTMENT DETAILS
============================================================ */

function AppointmentDetails({
  appointment,
  onClose,
  onStatusChange,
  onSaveMeetingLink,
}: {
  appointment: Appointment;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: AppointmentStatus
  ) => void;
  onSaveMeetingLink: (
    id: string,
    link: string
  ) => void;
}) {
  const [meetingLink, setMeetingLink] =
    useState(appointment.meetingLink);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div>

      <button
        type="button"
        onClick={onClose}
        className="mb-6 text-sm font-medium text-[#087f3e] hover:underline"
      >
        ← Back
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-semibold md:text-3xl">
            Appointment Details
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage this student's appointment.
          </p>

        </div>

        <StatusBadge status={appointment.status} />

      </div>


      <div className="grid gap-6 xl:grid-cols-3">

        <div className="space-y-6 xl:col-span-2">

          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-lg font-semibold text-[#087f3e]">
                {appointment.studentName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="text-xs text-gray-400">
                  Student
                </p>

                <p className="mt-1 truncate text-lg font-semibold">
                  {appointment.studentName}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {appointment.studentId}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {appointment.email}
                </p>

              </div>

            </div>

          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <h2 className="font-semibold">
              Schedule and request
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <Detail
                label="Date"
                value={appointment.date}
              />

              <Detail
                label="Time"
                value={appointment.time}
              />

              <Detail
                label="Year Level"
                value={appointment.yearLevel}
              />

              <Detail
                label="Mode"
                value={appointment.mode}
              />

              <Detail
                label="Appointment Type"
                value={appointment.appointmentType}
              />

              {appointment.reason && (
                <Detail
                  label="Reason"
                  value={appointment.reason}
                />
              )}

            </div>

            {appointment.message && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400">
                  Additional / Referral Details
                </p>
                <p className="mt-2 whitespace-pre-line text-sm font-medium text-gray-800">
                  {appointment.message}
                </p>
              </div>
            )}

          </div>

        </div>


        <div className="space-y-6">

          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <label className="mb-2 block text-sm font-medium">
              Appointment Status
            </label>

            <select
              value={appointment.status}
              onChange={(e) =>
                onStatusChange(
                  appointment.id,
                  e.target.value as AppointmentStatus
                )
              }
              className="input"
            >

              <option>Pending</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>

            </select>

            <p className="mt-2 text-xs text-gray-500">
              Setting status to Confirmed sends a no-reply approval email to the student.
            </p>

          </div>


          {appointment.mode === "Online" && (

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <VideoIcon />
                </div>

                <div>

                  <p className="text-sm font-semibold text-blue-900">
                    Video Call Appointment
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    Add the meeting link that the student should use.
                  </p>

                </div>

              </div>


              <input
                type="url"
                value={meetingLink}
                onChange={(e) =>
                  setMeetingLink(e.target.value)
                }
                placeholder="https://meet.google.com/..."
                className="mt-4 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              />


              <div className="mt-3 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    onSaveMeetingLink(
                      appointment.id,
                      meetingLink
                    )
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save Meeting Link
                </button>


                {meetingLink && (

                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Open Video Call
                  </a>

                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">

      <h1 className="text-2xl font-semibold md:text-3xl">
        {title}
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>

    </div>
  );
}


function NavButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (

    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
        active
          ? "bg-green-50 text-[#087f3e]"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>

  );
}


function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (

    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-[#087f3e]">
          {icon}
        </div>

      </div>

    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const styles = {
    Pending: "bg-yellow-50 text-yellow-700",
    Confirmed: "bg-blue-50 text-blue-700",
    Completed: "bg-green-50 text-green-700",
    Cancelled: "bg-red-50 text-red-700",
  };

  return (

    <span
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}


function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (

    <div>

      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}

    </div>
  );
}


function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (

    <div>

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-800">
        {value}
      </p>

    </div>
  );
}


function AnalyticsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (

    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <h2 className="font-semibold">
        {title}
      </h2>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>

      <div className="mt-7 space-y-5">
        {children}
      </div>

    </div>
  );
}


function Progress({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total === 0
      ? 0
      : Math.round((value / total) * 100);

  return (

    <div>

      <div className="mb-2 flex justify-between">

        <span className="text-sm text-gray-600">
          {label}
        </span>

        <span className="text-sm font-semibold">
          {value} ({percentage}%)
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className="h-full rounded-full bg-[#087f3e]"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}


/* ============================================================
   ICONS
============================================================ */

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}


function StudentsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}


function AppointmentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}


function ChartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}


function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}


function VideoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}


function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
      <path d="M9 21v-7h6v7" />
    </svg>
  );
}

