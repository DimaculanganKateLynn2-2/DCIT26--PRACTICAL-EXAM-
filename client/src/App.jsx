
import { useState } from "react";
import SymptomChecker from "./pages/SymptomChecker";
import SafetyToxins from "./pages/SafetyToxins";
import MyPets from "./pages/MyPets";

function App() {
  const [page, setPage] = useState("Home");

const navigation = [
  "Home",
  "Symptom Checker",
  "Safety & Toxins",
  "My Pets",
  "About Us",
];

  const changePage = (selectedPage) => {
    setPage(selectedPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-green-50 text-gray-800">

      {/* NAVIGATION BAR */}
      <header className="bg-green-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-3xl">
              🌿
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                VetCare Meadow
              </h1>
              <p className="text-sm text-green-100">
                Pet Health & Triage Portal
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                key={item}
                onClick={() => changePage(item)}
                className={`rounded-full px-5 py-3 font-semibold transition ${
                  page === item
                    ? "bg-white text-green-800"
                    : "bg-green-700 text-white hover:bg-green-600"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {page === "Home" ? (
        <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">

          {/* HERO SECTION */}
          <section className="rounded-3xl bg-green-600 px-8 py-14 text-white shadow-lg md:px-12">

            <span className="rounded-full bg-green-700 px-5 py-2 text-sm font-bold">
              🌿 PET WELLNESS & SAFETY PORTAL
            </span>

            <h2 className="mt-8 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Helpful guidance when your pet needs you most.
            </h2>

            <p className="mt-6 max-w-3xl text-lg text-green-50">
              Check observed symptoms, learn about potential
              warning signs, explore pet safety information,
              and prepare for a veterinary consultation.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={() => changePage("Symptom Checker")}
                className="rounded-xl bg-white px-7 py-4 font-bold text-green-800 shadow hover:bg-green-50"
              >
                🩺 Start Symptom Checker
              </button>

              <button
                onClick={() => changePage("Safety & Toxins")}
                className="rounded-xl border-2 border-white px-7 py-4 font-bold text-white hover:bg-green-700"
              >
                ⚠️ Toxic Foods Guide
              </button>
            </div>
          </section>

          {/* FEATURE CARDS */}
          <section className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Pet Health Guidance",
                description: "Educational symptom information",
              },
              {
                title: "Canine & Feline",
                description: "Guidance for dogs and cats",
              },
              {
                title: "Safety-First",
                description: "Emergency warning awareness",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm"
              >
                <h3 className="text-xl font-bold text-green-700">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </section>

          {/* HOW IT WORKS */}
          <section className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-bold text-green-900">
              How VetCare Meadow Works
            </h2>

            <p className="mt-2 text-gray-600">
              Three simple steps to help you make informed
              decisions and prepare for veterinary care.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">

              <StepCard
                number="1"
                title="Select Pet & Symptoms"
                description="Choose Dog or Cat, select observed symptoms, and provide your pet's age and notes."
              />

              <StepCard
                number="2"
                title="Review Guidance"
                description="Receive educational information, safety reminders, and advice on when to contact a veterinarian."
              />

              <div className="md:col-span-2">
                <StepCard
                  number="3"
                  title="Prepare for a Vet Visit"
                  description="Review a summary of the symptoms and observations you can share with a veterinary professional."
                />
              </div>
            </div>
          </section>

          {/* EMERGENCY NOTICE */}
          <section className="flex flex-col gap-5 rounded-3xl border border-red-200 bg-red-50 p-8 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold text-red-800">
                🚨 Experiencing a Pet Emergency?
              </h2>

              <p className="mt-2 max-w-2xl text-red-700">
                If your pet is unconscious, having seizures,
                bleeding heavily, or struggling to breathe,
                seek immediate veterinary care. Do not wait
                for an online symptom assessment.
              </p>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=emergency+veterinary+clinic"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-red-600 px-6 py-4 text-center font-bold text-white hover:bg-red-700"
            >
              📍 Search Vet Clinics
            </a>
          </section>

          <p className="text-center text-sm text-gray-500">
            VetCare Meadow provides educational information
            only and does not replace veterinary diagnosis
            or treatment.
          </p>
        </main>
         ) : page === "Symptom Checker" ? (
  <SymptomChecker />
) : page === "Safety & Toxins" ? (
  <SafetyToxins />
) : page === "My Pets" ? (
  <MyPets />
) : (
        <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-12">

          <section className="rounded-3xl bg-white p-10 shadow-sm">
            <h2 className="text-3xl font-bold text-green-800">
              {page}
            </h2>

            <p className="mt-4 text-gray-600">
              This page will be developed in the next steps
              of our VetCare Meadow project.
            </p>

            <button
              onClick={() => changePage("Home")}
              className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Back to Home
            </button>
          </section>
        </main>
      )}

      {/* FOOTER */}
      <footer className="border-t border-green-200 px-6 py-8 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-5">
          {navigation.map((item) => (
            <button
              key={item}
              onClick={() => changePage(item)}
              className="font-medium text-green-800 hover:underline"
            >
              {item}
            </button>
          ))}
        </div>

        <p className="text-sm text-green-900">
          © 2026 VetCare Meadow · Pet Health Awareness
          & Safety Guidance
        </p>
      </footer>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-7">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-green-600 font-bold text-white">
        {number}
      </div>

      <h3 className="text-xl font-bold text-green-900">
        {title}
      </h3>

      <p className="mt-3 text-gray-600">
        {description}
      </p>
    </div>
  );
}

export default App;
