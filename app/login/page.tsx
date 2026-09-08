"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "Student" | "Counselor" | "Admin";

export default function Login() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // Demo login credentials
    const accounts = {
      Student: {
        email: "student@psycheck.com",
        password: "psycheck1234",
      },
      Counselor: {
        email: "counselor@psycheck.com",
        password: "psycheck1234",
      },
      Admin: {
        email: "admin@psycheck.com",
        password: "psycheck1234",
      },
    };

    const account = accounts[role];

    // Check email and password
    if (
      email.toLowerCase() !== account.email ||
      password !== account.password
    ) {
      setError("Invalid email or password.");
      return;
    }

    // Redirect based on role
    if (role === "Counselor" || role === "Admin") {
      // Save admin/counselor login status
      localStorage.setItem("psycheck_admin", "true");

      router.push("/admin-dashboard");
    } else {
      // Student goes to the Booking page
      router.push("/booking");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F0FDF4] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        {/* Logo / Header */}
        <div className="mb-8 text-center">

          {/* PsyCheck Logo */}
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

        {/* Role Selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-semibold text-[#064E3B]">
            Login as
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(["Student", "Counselor", "Admin"] as Role[]).map(
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#A7F3D0]"
            />
          </div>

          {/* Password */}
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#A7F3D0]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Forgot Password */}
          <div className="text-right">
            <a
              href="#"
              className="text-sm font-medium text-[#059669] hover:text-[#047857] hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#10B981] py-3.5 font-semibold text-white shadow-md transition hover:bg-[#059669] hover:shadow-lg"
          >
            Login as {role}
          </button>
        </form>

        {/* Back to Home */}
        <p className="mt-7 text-center text-sm text-gray-500">
          <a
            href="/"
            className="font-semibold text-[#059669] hover:text-[#047857] hover:underline"
          >
            ← Back to Home
          </a>
        </p>

      </div>
    </main>
  );
}