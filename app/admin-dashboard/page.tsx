"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab =
  | "dashboard"
  | "availability"
  | "appointments"
  | "analytics";

type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

type AppointmentMode = "Online" | "In-person";

type Appointment = {
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
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  mode: AppointmentMode;
};

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "A001",
    studentName: "Juan Dela Cruz",
    studentId: "2024-00123",
    email: "juan@example.com",
    yearLevel: "3rd Year",
    appointmentType: "Initial Consultation",
    mode: "Online",
    date: "August 10, 2026",
    time: "9:00 AM",
    status: "Pending",
    meetingLink: "",
  },
  {
    id: "A002",
    studentName: "Maria Santos",
    studentId: "2024-00124",
    email: "maria@example.com",
    yearLevel: "2nd Year",
    appointmentType: "Counseling Session",
    mode: "Online",
    date: "August 10, 2026",
    time: "10:30 AM",
    status: "Confirmed",
    meetingLink: "",
  },
  {
    id: "A003",
    studentName: "John Reyes",
    studentId: "2023-00451",
    email: "john@example.com",
    yearLevel: "4th Year",
    appointmentType: "Follow-up Session",
    mode: "In-person",
    date: "August 11, 2026",
    time: "1:00 PM",
    status: "Pending",
    meetingLink: "",
  },
  {
    id: "A004",
    studentName: "Angela Garcia",
    studentId: "2024-00231",
    email: "angela@example.com",
    yearLevel: "1st Year",
    appointmentType: "Initial Consultation",
    mode: "Online",
    date: "August 12, 2026",
    time: "2:00 PM",
    status: "Completed",
    meetingLink: "",
  },
];

const DEMO_AVAILABILITY: Availability[] = [
  {
    id: "S001",
    date: "August 10, 2026",
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    appointmentType: "Initial Consultation",
    mode: "Online",
  },
  {
    id: "S002",
    date: "August 10, 2026",
    startTime: "10:30 AM",
    endTime: "11:30 AM",
    appointmentType: "Counseling Session",
    mode: "Online",
  },
  {
    id: "S003",
    date: "August 11, 2026",
    startTime: "1:00 PM",
    endTime: "2:00 PM",
    appointmentType: "Follow-up Session",
    mode: "In-person",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<Tab>("dashboard");

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [availability, setAvailability] =
    useState<Availability[]>([]);

  const [search, setSearch] = useState("");

  const [showScheduleForm, setShowScheduleForm] =
    useState(false);

  const [showAppointment, setShowAppointment] =
    useState<Appointment | null>(null);

  const [message, setMessage] = useState("");

  // Schedule form
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [appointmentType, setAppointmentType] =
    useState("Initial Consultation");

  const [mode, setMode] =
    useState<AppointmentMode>("Online");

  // ============================================================
  // LOGIN PROTECTION
  // ============================================================

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("psycheck_admin");

    if (loggedIn !== "true") {
      router.replace("/login");
      return;
    }

    loadData();
  }, [router]);

  function loadData() {
    const storedAppointments =
      localStorage.getItem("psycheck_appointments");

    const storedAvailability =
      localStorage.getItem("psycheck_availability");

    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    } else {
      setAppointments(DEMO_APPOINTMENTS);
      localStorage.setItem(
        "psycheck_appointments",
        JSON.stringify(DEMO_APPOINTMENTS)
      );
    }

    if (storedAvailability) {
      setAvailability(JSON.parse(storedAvailability));
    } else {
      setAvailability(DEMO_AVAILABILITY);
      localStorage.setItem(
        "psycheck_availability",
        JSON.stringify(DEMO_AVAILABILITY)
      );
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("psycheck_admin");
    router.push("/login");
  };

  function saveAppointments(
    updated: Appointment[]
  ) {
    setAppointments(updated);

    localStorage.setItem(
      "psycheck_appointments",
      JSON.stringify(updated)
    );
  }

  function saveAvailability(
    updated: Availability[]
  ) {
    setAvailability(updated);

    localStorage.setItem(
      "psycheck_availability",
      JSON.stringify(updated)
    );
  }

  function createSchedule() {
    if (!date || !startTime || !endTime) {
      setMessage("Please complete all schedule fields.");
      return;
    }

    const newSchedule: Availability = {
      id: crypto.randomUUID(),
      date: formatDate(date),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      appointmentType,
      mode,
    };

    saveAvailability([
      ...availability,
      newSchedule,
    ]);

    setDate("");
    setStartTime("");
    setEndTime("");

    setMessage("Availability successfully added.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function removeSchedule(id: string) {
    const updated = availability.filter(
      (item) => item.id !== id
    );

    saveAvailability(updated);
  }

  function updateStatus(
    id: string,
    status: AppointmentStatus
  ) {
    const updated = appointments.map((appointment) =>
      appointment.id === id
        ? {
            ...appointment,
            status,
          }
        : appointment
    );

    saveAppointments(updated);

    if (showAppointment?.id === id) {
      setShowAppointment(
        updated.find(
          (appointment) => appointment.id === id
        ) || null
      );
    }
  }

  function saveMeetingLink(
    id: string,
    link: string
  ) {
    const updated = appointments.map((appointment) =>
      appointment.id === id
        ? {
            ...appointment,
            meetingLink: link,
          }
        : appointment
    );

    saveAppointments(updated);

    if (showAppointment?.id === id) {
      setShowAppointment(
        updated.find(
          (appointment) => appointment.id === id
        ) || null
      );
    }

    setMessage("Video call link saved.");

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  const pending = appointments.filter(
    (a) => a.status === "Pending"
  ).length;

  const confirmed = appointments.filter(
    (a) => a.status === "Confirmed"
  ).length;

  const completed = appointments.filter(
    (a) => a.status === "Completed"
  ).length;

  const onlineAppointments = appointments.filter(
    (a) => a.mode === "Online"
  ).length;

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
                Administrator
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
            onClick={() => setActiveTab("dashboard")}
          >
            <DashboardIcon />
            Dashboard
          </NavButton>


          <NavButton
            active={activeTab === "availability"}
            onClick={() =>
              setActiveTab("availability")
            }
          >
            <CalendarIcon />
            My Availability
          </NavButton>


          <NavButton
            active={activeTab === "appointments"}
            onClick={() =>
              setActiveTab("appointments")
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
              setActiveTab("analytics")
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


          {/* DASHBOARD */}

          {activeTab === "dashboard" && (

            <div>

              <PageHeader
                title="Dashboard"
                description="Manage student appointments, availability, and service activity."
              />


              {/* STATISTICS */}

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

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

                <StatCard
                  title="Online Sessions"
                  value={onlineAppointments}
                  icon={<VideoIcon />}
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
                        setActiveTab("appointments")
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
                        setActiveTab("availability")
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
                        setActiveTab("appointments")
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
                        setActiveTab("analytics")
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
                  Supabase is not connected yet
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  The dashboard is currently using browser
                  storage for testing. Once Supabase is
                  connected, student appointments,
                  schedules, and meeting links can be
                  synchronized between the student and
                  administrator devices.
                </p>

              </div>

            </div>

          )}


          {/* AVAILABILITY */}

          {activeTab === "availability" && (

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

                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) =>
                            setStartTime(e.target.value)
                          }
                          className="input"
                        />

                      </Field>


                      <Field label="End">

                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) =>
                            setEndTime(e.target.value)
                          }
                          className="input"
                        />

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
                          Initial Consultation
                        </option>

                        <option>
                          Counseling Session
                        </option>

                        <option>
                          Follow-up Session
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

          {activeTab === "appointments" && (

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

          {activeTab === "analytics" && (

            <Analytics
              appointments={appointments}
            />

          )}

        </section>

      </div>


      {/* APPOINTMENT MODAL */}

      {showAppointment && (

        <AppointmentModal
          appointment={showAppointment}
          onClose={() =>
            setShowAppointment(null)
          }
          onStatusChange={updateStatus}
          onSaveMeetingLink={saveMeetingLink}
        />

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

  const initial = appointments.filter(
    (a) =>
      a.appointmentType ===
      "Initial Consultation"
  ).length;

  const counseling = appointments.filter(
    (a) =>
      a.appointmentType ===
      "Counseling Session"
  ).length;

  const followup = appointments.filter(
    (a) =>
      a.appointmentType ===
      "Follow-up Session"
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
            label="Initial Consultation"
            value={initial}
            total={total}
          />

          <Progress
            label="Counseling Session"
            value={counseling}
            total={total}
          />

          <Progress
            label="Follow-up Session"
            value={followup}
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
   APPOINTMENT MODAL
============================================================ */

function AppointmentModal({
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

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div>

            <h2 className="font-semibold">
              Appointment Details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Manage this student's appointment.
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>

        </div>


        {/* CONTENT */}

        <div className="space-y-5 p-6">


          {/* STUDENT */}

          <div className="rounded-lg bg-gray-50 p-4">

            <p className="text-xs text-gray-400">
              Student
            </p>

            <p className="mt-1 font-semibold">
              {appointment.studentName}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {appointment.studentId}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {appointment.email}
            </p>

          </div>


          {/* DETAILS */}

          <div className="grid grid-cols-2 gap-4">

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

          </div>


          <Detail
            label="Appointment Type"
            value={appointment.appointmentType}
          />


          {/* STATUS */}

          <div>

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

          </div>


          {/* VIDEO CALL */}

          {appointment.mode === "Online" && (

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

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


              <div className="mt-3 flex gap-2">

                <button
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


        {/* FOOTER */}

        <div className="flex justify-end border-t border-gray-100 p-6">

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>

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


/* ============================================================
   HELPERS
============================================================ */

function formatDate(value: string) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}


function formatTime(value: string) {
  const [hours, minutes] = value.split(":");

  const hour = Number(hours);

  const period = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
}