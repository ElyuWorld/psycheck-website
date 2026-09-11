"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import {
  PARSU_STUDENT_EMAIL_HTML_PATTERN,
  PARSU_STUDENT_EMAIL_SUFFIX,
  isParsuStudentEmail,
} from "@/lib/parsu-email";

type Mode = "login" | "register";
type RoleLabel = "Student" | "Counselor" | "Admin";

const ROLE_MAP: Record<RoleLabel, UserRole> = {
  Student: "student",
  Counselor: "counselor",
  Admin: "admin",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#A7F3D0]";

export default function Login() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<RoleLabel>("Student");

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
    if (next === "register") {
      setRole("Student");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError || !authData.user) {
        setError(authError?.message || "Invalid email or password.");
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        const meta = authData.user.user_metadata || {};
        const { error: insertError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: authData.user.email || email.trim().toLowerCase(),
          full_name: String(meta.full_name || "").trim(),
          role: "student",
          student_id: meta.student_id ? String(meta.student_id) : null,
          year_level: meta.year_level ? String(meta.year_level) : null,
        });

        if (insertError) {
          setError(
            "Account found, but no profile exists. In Supabase SQL Editor, run supabase/fix-student-profile.sql"
          );
          await supabase.auth.signOut();
          return;
        }

        const created = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        profile = created.data;
      }

      if (!profile) {
        setError(
          "Account found, but no profile exists. In Supabase SQL Editor, run supabase/fix-student-profile.sql"
        );
        await supabase.auth.signOut();
        return;
      }

      const expectedRole = ROLE_MAP[role];

      if (profile.role !== expectedRole) {
        setError(
          `This account is registered as ${profile.role}, not ${expectedRole}. Choose the correct role.`
        );
        await supabase.auth.signOut();
        return;
      }

      if (profile.role === "counselor" || profile.role === "admin") {
        router.push("/admin-dashboard");
      } else {
        router.push("/booking");
      }

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to connect to Supabase.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const name = fullName.trim();
    const idNumber = studentId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!name || !idNumber || !yearLevel) {
      setError("Please complete all registration fields.");
      setLoading(false);
      return;
    }

    if (!isParsuStudentEmail(cleanEmail)) {
      setError(
        `Use your ParSU student email ending in ${PARSU_STUDENT_EMAIL_SUFFIX}.`
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name,
            role: "student",
            student_id: idNumber,
            year_level: yearLevel,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: name,
          student_id: idNumber,
          year_level: yearLevel,
          role: "student",
        });
      }

      if (data.session) {
        setSuccess("Registration successful. Redirecting to booking...");
        router.push("/booking");
        router.refresh();
        return;
      }

      setSuccess(
        "Registration successful. You can now log in as Student with your email and password."
      );
      setMode("login");
      setRole("Student");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setStudentId("");
      setYearLevel("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to register account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F0FDF4] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D1FAE5]">
            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={80}
              height={80}
              priority
              className="object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-[#064E3B]">
            Welcome to PsyCheck
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Your well-being matters. We are here to help.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#ECFDF5] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-[#047857] shadow-sm"
                : "text-[#059669] hover:bg-white/60"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-white text-[#047857] shadow-sm"
                : "text-[#059669] hover:bg-white/60"
            }`}
          >
            Register
          </button>
        </div>

        {mode === "login" && (
          <>
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-[#064E3B]">
                Login as
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(["Student", "Counselor", "Admin"] as RoleLabel[]).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setRole(item);
                        setError("");
                      }}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                        role === item
                          ? "border-[#10B981] bg-[#10B981] text-white shadow-md"
                          : "border-[#D1FAE5] bg-white text-[#047857] hover:bg-[#ECFDF5]"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#10B981] py-3.5 font-semibold text-white shadow-md transition hover:bg-[#059669] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : `Login as ${role}`}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              New student?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold text-[#059669] hover:underline"
              >
                Create an account
              </button>
            </p>
          </>
        )}

        {mode === "register" && (
          <>
            <div className="mb-5 rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
              Student registration only. New accounts appear in the Admin
              Students list.
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <input
                  type="text"
                  placeholder="2024-00123"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year Level
                </label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select year level
                  </option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder={`juan.delacruz${PARSU_STUDENT_EMAIL_SUFFIX}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  pattern={PARSU_STUDENT_EMAIL_HTML_PATTERN}
                  title={`Must end with ${PARSU_STUDENT_EMAIL_SUFFIX}`}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Required format: yourname{PARSU_STUDENT_EMAIL_SUFFIX}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#10B981] py-3.5 font-semibold text-white shadow-md transition hover:bg-[#059669] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Register as Student"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-[#059669] hover:underline"
              >
                Login
              </button>
            </p>
          </>
        )}

        <p className="mt-7 text-center text-sm text-gray-500">
          <Link
            href="/"
            className="font-semibold text-[#059669] hover:text-[#047857] hover:underline"
          >
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}
