"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function BookingPage() {
  const [showAlert, setShowAlert] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Show success alert
    setShowAlert(true);
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="w-full border-b border-gray-100 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* Logo */}
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
              <h1 className="text-lg font-semibold text-[#087f3e]">
                PsyCheck
              </h1>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">

            {/* Home Button */}
            <Link
              href="/"
              className="rounded-lg border border-[#087f3e] px-5 py-2.5 text-sm font-medium text-[#087f3e] transition hover:bg-green-50"
            >
              Home
            </Link>

            {/* Counselor Button */}
            <Link
              href="/login"
              className="rounded-lg bg-[#087f3e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Counselor
            </Link>

          </div>
        </nav>
      </header>


      {/* Booking Page */}
      <section className="bg-[#f7faf8] px-6 py-14">

        <div className="mx-auto max-w-4xl">

          {/* Page Heading */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-gray-900">
              Book an Appointment
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
              Schedule a psychosocial support appointment with our team.
              Please provide the information below.
            </p>
          </div>


          {/* Booking Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <form
              className="space-y-7"
              onSubmit={handleSubmit}
            >

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Enter your basic information.
                </p>
              </div>


              {/* Name */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  />
                </div>


                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  />
                </div>

              </div>


              {/* Student ID + Email */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="studentId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Student ID
                  </label>

                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  />
                </div>


                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  />
                </div>

              </div>


              {/* Appointment Details */}
              <div className="border-t border-gray-100 pt-7">

                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment Details
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Choose your preferred appointment schedule.
                </p>

              </div>


              {/* Service */}
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select appointment type
                  </option>

                  <option value="initial">
                    Initial Consultation
                  </option>

                  <option value="counseling">
                    Counseling Session
                  </option>

                  <option value="follow-up">
                    Follow-up Session
                  </option>

                  <option value="referral">
                    Referral / Consultation
                  </option>

                  <option value="online">
                    Online Appointment
                  </option>
                </select>
              </div>


              {/* Date and Time */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Preferred Date
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  />
                </div>


                <div>
                  <label
                    htmlFor="time"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Preferred Time
                  </label>

                  <select
                    id="time"
                    name="time"
                    defaultValue=""
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="" disabled>
                      Select a time
                    </option>

                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>

              </div>


              {/* Reason */}
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
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f3e] focus:ring-2 focus:ring-green-100"
                >
                  <option value="" disabled>
                    Select an option
                  </option>

                  <option value="academic">
                    Academic Concerns
                  </option>

                  <option value="personal">
                    Personal Concerns
                  </option>

                  <option value="relationships">
                    Relationship / Social Concerns
                  </option>

                  <option value="general">
                    General Consultation
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>


              {/* Additional Message */}
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


              {/* Privacy Notice */}
              <div className="rounded-lg bg-green-50 p-4">

                <p className="text-xs leading-5 text-gray-600">
                  Your information should only be collected and handled
                  according to your institution's privacy policies and
                  applicable data-protection requirements.
                </p>

              </div>


              {/* Submit */}
              <div className="flex justify-end border-t border-gray-100 pt-6">

                <button
                  type="submit"
                  className="rounded-lg bg-[#087f3e] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#066b34]"
                >
                  Request Appointment
                </button>

              </div>

            </form>

          </div>

        </div>

      </section>


      {/* SUCCESS ALERT */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

            {/* Check Icon */}
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


            {/* Alert Title */}
            <h2 className="mt-5 text-2xl font-semibold text-gray-900">
              Your Appointment was Submitted
            </h2>


            {/* Alert Message */}
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Your appointment request has been successfully
              submitted. Please wait for the administrator to
              review your request.
            </p>


            {/* Status */}
            <div className="mt-5 rounded-lg bg-green-50 px-4 py-3">

              <p className="text-sm font-medium text-[#087f3e]">
                Appointment Status: Pending
              </p>

            </div>


            {/* Close Button */}
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