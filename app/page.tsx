"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Create your account",
    text: "Register as a student and sign in securely to access PsyCheck support services.",
  },
  {
    number: "02",
    title: "Request an appointment",
    text: "Choose a preferred date, time, and type of psychosocial support session.",
  },
  {
    number: "03",
    title: "Connect with support",
    text: "Counselors review your request and guide you to the right help.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-[#f4fbf7] text-gray-900">
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={56}
              height={56}
              priority
              className="object-contain"
            />
            <span className="text-xl font-semibold tracking-tight text-[#087f3e]">
              PsyCheck
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#top"
              className="text-sm font-medium text-gray-600 transition hover:text-[#087f3e]"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition hover:text-[#087f3e]"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-gray-600 transition hover:text-[#087f3e]"
            >
              About
            </a>
            <Link
              href="/login"
              className="rounded-xl bg-[#087f3e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Log In
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-white text-[#087f3e] md:hidden"
          >
            <span className="sr-only">Menu</span>
            <div className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full rounded bg-current transition ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full rounded bg-current transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full rounded bg-current transition ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-emerald-50 bg-white px-6 py-5 md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#top"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-700"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-700"
              >
                How it works
              </a>
              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-700"
              >
                About
              </a>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-[#087f3e] px-5 py-3 text-center text-sm font-medium text-white"
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(45,212,191,0.18),_transparent_50%),linear-gradient(180deg,#f4fbf7_0%,#ffffff_70%)]" />
          <div className="home-float absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="home-float-delayed absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:gap-16 md:pb-28 md:pt-16">
          <div className="home-fade-up">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#087f3e]">
              PsyCheck
            </p>

            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Mental health matters, You matter.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
              Your well-being matters. PsyCheck helps students request
              psychosocial support in a simple, private, and accessible way.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#087f3e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#066b34] hover:shadow-lg hover:shadow-emerald-200"
              >
                Book Now
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-[#087f3e] transition hover:bg-emerald-50"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="home-fade-up-delayed relative mx-auto flex w-full max-w-md items-center justify-center md:max-w-lg">
            <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-emerald-300/40 via-teal-200/30 to-cyan-200/40 blur-2xl" />
            <div className="relative flex aspect-square w-full max-w-[420px] items-center justify-center rounded-[2rem] border border-emerald-900/20 bg-[#0b1220] p-8 shadow-[0_30px_80px_rgba(8,127,62,0.18)]">
              <Image
                src="/logo.png"
                alt="PsyCheck brain shield logo"
                width={320}
                height={320}
                priority
                className="home-logo-pulse h-auto w-full max-w-[280px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-t border-emerald-100/70 bg-white px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f3e]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Three simple steps to get support
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              PsyCheck keeps the path to help clear — from registration to
              appointment request.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <p className="text-5xl font-bold tracking-tight text-[#087f3e]">
                  {step.number}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="scroll-mt-24 border-t border-emerald-100/70 bg-[#f7faf8] px-6 py-20"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f3e]">
              About
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Built for students who need a safer way to ask for help
            </h2>
            <p className="mt-5 text-base leading-7 text-gray-600">
              PsyCheck is a web-based mental health screening and referral
              system designed to give students a convenient and accessible way
              to seek psychosocial support.
            </p>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Students can request appointments and connect with the right
              support personnel — making the process simpler, clearer, and more
              comfortable.
            </p>
          </div>

          <div className="space-y-6 border-l border-emerald-100 pl-0 md:pl-10">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Mental health screening
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Identify support needs early through an accessible screening
                pathway.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Easy appointment booking
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Request sessions with psychosocial support staff on your
                schedule.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Accessible support
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Connect with available services in a calm, student-friendly
                space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#087f3e] via-[#0a9a4d] to-[#14b8a6] px-8 py-14 text-white shadow-xl shadow-emerald-200/40 md:px-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready when you are
            </h2>
            <p className="mt-4 text-base leading-7 text-emerald-50">
              Create an account or log in to request an appointment. Your
              well-being matters — and support is one step away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#087f3e] transition hover:bg-emerald-50"
              >
                Get started
              </Link>
              <a
                href="#about"
                className="inline-flex rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <p className="font-semibold text-[#087f3e]">PsyCheck</p>
              <p className="text-xs text-gray-500">
                Mental Health Screening and Referral System
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">© 2026 PsyCheck. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
