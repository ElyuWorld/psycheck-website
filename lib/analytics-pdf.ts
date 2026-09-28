import type { AppointmentView } from "@/lib/types";
import type jsPDF from "jspdf";

const GREEN: [number, number, number] = [8, 127, 62];
const HEAD_FILL: [number, number, number] = [240, 253, 244];
const TEXT: [number, number, number] = [55, 65, 81];

type CountRow = { label: string; value: number };

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

function tableRows(rows: CountRow[], total: number) {
  return rows.map((row) => [row.label, String(row.value), percent(row.value, total)]);
}

function lastTableY(doc: jsPDF, fallback: number) {
  const table = (
    doc as jsPDF & { lastAutoTable?: { finalY: number } }
  ).lastAutoTable;
  return table?.finalY ?? fallback;
}

function setLastY(doc: jsPDF, y: number) {
  (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable = {
    finalY: y,
  };
}

function nextSectionY(doc: jsPDF, fallback: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = lastTableY(doc, fallback) + 28;

  if (y > pageHeight - 120) {
    doc.addPage();
    return 48;
  }

  return y;
}

export async function downloadAnalyticsPdfReport(
  appointments: AppointmentView[],
  studentsCount: number
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const fileDate = new Date().toISOString().slice(0, 10);
  const total = appointments.length;

  const confirmed = countOf(appointments, (item) => item.status === "Confirmed");
  const pending = countOf(appointments, (item) => item.status === "Pending");
  const completed = countOf(appointments, (item) => item.status === "Completed");
  const cancelled = countOf(appointments, (item) => item.status === "Cancelled");
  const online = countOf(appointments, (item) => item.mode === "Online");

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PsyCheck Student Analytics Report", 40, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Psychosocial support summary for authorized staff", 40, 52);
  doc.text(`Generated ${generatedAt}`, 40, 66);

  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Summary", 40, 108);

  autoTable(doc, {
    startY: 118,
    theme: "grid",
    head: [["Metric", "Count", "Description"]],
    body: [
      [
        "Registered Students",
        String(studentsCount),
        "Students who created a PsyCheck account.",
      ],
      [
        "Total Appointments",
        String(total),
        "All student requests submitted through PsyCheck.",
      ],
      [
        "Online Appointments",
        String(online),
        "Requests booked as an online or video-call session.",
      ],
      [
        "Pending",
        String(pending),
        "Requests still waiting for counselor review.",
      ],
      [
        "Confirmed",
        String(confirmed),
        "Requests approved by a counselor or admin.",
      ],
      [
        "Completed",
        String(completed),
        "Sessions that have already been finished.",
      ],
      [
        "Cancelled",
        String(cancelled),
        "Requests that were cancelled.",
      ],
    ],
    styles: { fontSize: 9, cellPadding: 6, textColor: TEXT },
    headStyles: {
      fillColor: GREEN,
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 60, halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  const figures: {
    title: string;
    caption: string;
    rows: CountRow[];
  }[] = [
    {
      title: "Appointment Types",
      caption:
        "Share of requests by service: counseling, referral, or online appointment.",
      rows: [
        {
          label: "Counseling Session",
          value: countOf(
            appointments,
            (item) => item.appointmentType === "Counseling Session"
          ),
        },
        {
          label: "Referral",
          value: countOf(
            appointments,
            (item) => item.appointmentType === "Referral"
          ),
        },
        {
          label: "Online Appointment",
          value: countOf(
            appointments,
            (item) => item.appointmentType === "Online Appointment"
          ),
        },
      ],
    },
    {
      title: "Students by Year Level",
      caption:
        "How booked appointments are spread across 1st through 4th year students.",
      rows: [
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
    },
    {
      title: "Appointment Status",
      caption:
        "Where requests stand now: pending, confirmed, completed, or cancelled.",
      rows: [
        { label: "Pending", value: pending },
        { label: "Confirmed", value: confirmed },
        { label: "Completed", value: completed },
        { label: "Cancelled", value: cancelled },
      ],
    },
    {
      title: "Appointment Mode",
      caption:
        "Whether students booked an online video call or an in-person session.",
      rows: [
        { label: "Online / Video Call", value: online },
        {
          label: "In-person",
          value: countOf(appointments, (item) => item.mode === "In-person"),
        },
      ],
    },
  ];

  for (const figure of figures) {
    const startY = nextSectionY(doc, 118);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT);
    doc.text(figure.title, 40, startY);

    autoTable(doc, {
      startY: startY + 10,
      theme: "grid",
      head: [["Category", "Count", "Share"]],
      body: tableRows(figure.rows, total),
      styles: { fontSize: 9, cellPadding: 6, textColor: TEXT },
      headStyles: {
        fillColor: GREEN,
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: HEAD_FILL },
      columnStyles: {
        1: { cellWidth: 70, halign: "right" },
        2: { cellWidth: 70, halign: "right" },
      },
      margin: { left: 40, right: 40, bottom: 48 },
    });

    const captionY = lastTableY(doc, startY) + 14;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const captionLines = doc.splitTextToSize(figure.caption, pageWidth - 80);
    doc.text(captionLines, 40, captionY);
    setLastY(doc, captionY + captionLines.length * 11);
  }

  const listStart = nextSectionY(doc, 118);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text("Appointment Records", 40, listStart);

  autoTable(doc, {
    startY: listStart + 10,
    theme: "grid",
    head: [["Student", "ID", "Type", "Date", "Time", "Mode", "Status"]],
    body:
      appointments.length > 0
        ? appointments.map((appointment) => [
            appointment.studentName,
            appointment.studentId,
            appointment.appointmentType,
            appointment.date,
            appointment.time,
            appointment.mode,
            appointment.status,
          ])
        : [["No appointment records yet.", "", "", "", "", "", ""]],
    styles: { fontSize: 8, cellPadding: 5, textColor: TEXT },
    headStyles: {
      fillColor: GREEN,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: HEAD_FILL },
    margin: { left: 40, right: 40, bottom: 48 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Confidential — authorized PsyCheck staff only. Do not share this report outside the guidance office.",
      40,
      pageHeight - 28
    );
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 40, pageHeight - 28, {
      align: "right",
    });
  }

  doc.save(`PsyCheck-Student-Analytics-Report-${fileDate}.pdf`);
}
