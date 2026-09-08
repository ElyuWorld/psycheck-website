import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* Logo - Top Left */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="PsyCheck Logo"
              width={75}
              height={75}
              priority
              className="object-contain"
            />

            <div className="ml-3">
              <h1 className="text-lg font-semibold text-[#087f3e]">
                PsyCheck
              </h1>
            </div>
          </Link>

          {/* Navigation - Top Right */}
          <div className="flex items-center gap-8">

            {/* Home Button */}
            <a
              href="#top"
              className="text-sm font-medium text-gray-700 transition hover:text-[#087f3e]"
            >
              Home
            </a>

            {/* About Button */}
            <a
              href="#about"
              className="text-sm font-medium text-gray-700 transition hover:text-[#087f3e]"
            >
              About
            </a>

            {/* Log In Button */}
            <Link
              href="/login"
              className="rounded-lg bg-[#087f3e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Log In
            </Link>

          </div>

        </nav>
      </header>


      {/* Page Content */}
      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid grid-cols-2 items-center gap-16">

          {/* Left Side */}
          <div>

            <h2 className="text-4xl font-semibold text-gray-900">
              Welcome to PsyCheck
            </h2>

            <p className="mt-4 max-w-xl text-gray-500">
              Your well-being matters.
              We are here to help.
            </p>

            {/* Book Now Button */}
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-[#087f3e] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#066b34]"
            >
              Book Now
            </Link>

          </div>


          {/* Right Side - Photo Collage */}
          <div className="mx-auto w-full max-w-[550px]">

            <div className="grid grid-cols-5 gap-1">

              {/* Top Left - Narrow */}
              <div className="col-span-2 h-[140px] overflow-hidden">
                <Image
                  src="/room1.jpg"
                  alt="Psychosocial service room"
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Top Right - Wide */}
              <div className="col-span-3 h-[140px] overflow-hidden">
                <Image
                  src="/room2.jpg"
                  alt="Psychosocial service room"
                  width={600}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Bottom Left - Wide */}
              <div className="col-span-3 h-[140px] overflow-hidden">
                <Image
                  src="/room3.jpg"
                  alt="Psychosocial service room"
                  width={600}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Bottom Right - Narrow */}
              <div className="col-span-2 h-[140px] overflow-hidden">
                <Image
                  src="/room4.jpg"
                  alt="Psychosocial service room"
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* About Section */}
      <section
        id="about"
        className="scroll-mt-20 border-t border-gray-100 bg-[#f7faf8] px-6 py-20"
      >

        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-3xl font-semibold text-gray-900">
            About PsyCheck
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-gray-600">
            PsyCheck is a web-based mental health screening and referral
            system designed to provide students with a convenient and
            accessible way to seek psychosocial support.
          </p>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600">
            The system helps students access mental health screening,
            request appointments, and connect with appropriate support
            services. PsyCheck aims to make the process of seeking help
            simpler, more accessible, and more comfortable for students.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            {/* Feature 1 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl text-[#087f3e]">✓</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Mental Health Screening
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Provides students with accessible mental health screening
                to help identify their support needs.
              </p>
            </div>


            {/* Feature 2 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl text-[#087f3e]">📅</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Easy Appointment Booking
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Allows students to conveniently request appointments
                with the appropriate psychosocial support personnel.
              </p>
            </div>


            {/* Feature 3 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl text-[#087f3e]">♡</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Accessible Support
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Helps students connect with available support services
                in a simple and user-friendly environment.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl text-center">

          <p className="text-sm text-gray-500">
            © 2026 PsyCheck. Mental Health Screening and Referral System.
          </p>

        </div>
      </footer>

    </main>
  );
}