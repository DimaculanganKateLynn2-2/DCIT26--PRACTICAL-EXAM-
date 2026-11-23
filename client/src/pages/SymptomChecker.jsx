
import { useState } from "react";

const symptomOptions = [
  { name: "Loss of Appetite", category: "General" },
  { name: "Low Energy", category: "General" },
  { name: "Excessive Thirst", category: "General" },
  { name: "Vomiting", category: "Digestive" },
  { name: "Diarrhea", category: "Digestive" },
  { name: "Scratching Skin", category: "Skin & Ears" },
  { name: "Head Shaking", category: "Skin & Ears" },
  { name: "Ear Redness", category: "Skin & Ears" },
  { name: "Coughing", category: "Respiratory" },
  { name: "Sneezing", category: "Respiratory" },
  { name: "Limping", category: "Movement" },
  {
    name: "Difficulty Breathing",
    category: "Emergency Signs",
    emergency: true,
  },
  {
    name: "Seizures",
    category: "Emergency Signs",
    emergency: true,
  },
  {
    name: "Collapse",
    category: "Emergency Signs",
    emergency: true,
  },
  {
    name: "Heavy Bleeding",
    category: "Emergency Signs",
    emergency: true,
  },
  {
    name: "Straining to Urinate With No Urine",
    category: "Emergency Signs",
    emergency: true,
  },
];

const categories = [
  "All",
  "General",
  "Digestive",
  "Skin & Ears",
  "Respiratory",
  "Movement",
  "Emergency Signs",
];

function SymptomChecker() {
  const [petType, setPetType] = useState("Dog");
  const [petName, setPetName] = useState("");
  const [petAge, setPetAge] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const filteredSymptoms = symptomOptions.filter((symptom) => {
    const matchesSearch = symptom.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || symptom.category === category;

    return matchesSearch && matchesCategory;
  });

  const hasEmergency = symptomOptions.some(
    (symptom) =>
      symptom.emergency &&
      selectedSymptoms.includes(symptom.name)
  );

  function toggleSymptom(name) {
    setSelectedSymptoms((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );

    setResult(null);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }

    if (!duration) {
      setError("Please select how long the symptoms have lasted.");
      return;
    }

    setError("");

    setResult({
      petType,
      petName: petName.trim() || "Not provided",
      petAge: petAge || "Not provided",
      duration,
      symptoms: [...selectedSymptoms],
      notes: notes.trim(),
      emergency: hasEmergency,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-gray-800">

      {/* HEADER */}
      <div className="mb-8">
        <span className="font-semibold text-green-600">
          🐾 PET HEALTH & WELLNESS
        </span>

        <h1 className="mt-3 text-4xl font-bold text-green-900">
          Pet Symptom Checker
        </h1>

        <p className="mt-3 text-gray-600">
          Tell us about your pet and select the symptoms
          you have noticed.
        </p>
      </div>

      {/* SAFETY NOTICE */}
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-bold text-amber-900">
          Important Health Reminder
        </h2>

        <p className="mt-2 text-sm text-amber-800">
          This tool is for educational purposes only.
          It cannot diagnose illnesses or replace a
          veterinarian. If your pet has serious or
          rapidly worsening symptoms, seek veterinary
          assistance immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* PET INFORMATION */}
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            1. Pet Information
          </h2>

          <p className="mt-2 text-gray-500">
            Provide a few details about your pet.
          </p>

          <div className="mt-7">
            <label className="font-semibold">
              Select Pet Type
            </label>

            <div className="mt-3 grid grid-cols-2 gap-4">
              {["Dog", "Cat"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setPetType(type);
                    setResult(null);
                  }}
                  aria-pressed={petType === type}
                  className={`rounded-2xl border-2 p-5 text-center transition ${
                    petType === type
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-300"
                  }`}
                >
                  <div className="text-4xl">
                    {type === "Dog" ? "🐶" : "🐱"}
                  </div>

                  <p className="mt-2 font-bold">{type}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="petName"
                className="font-semibold"
              >
                Pet Name (Optional)
              </label>

              <input
                id="petName"
                type="text"
                maxLength={60}
                placeholder="Enter pet name"
                value={petName}
                onChange={(e) => {
                  setPetName(e.target.value);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="petAge"
                className="font-semibold"
              >
                Pet Age in Years (Optional)
              </label>

              <input
                id="petAge"
                type="number"
                min="0"
                max="40"
                step="0.1"
                placeholder="Example: 2"
                value={petAge}
                onChange={(e) => {
                  setPetAge(e.target.value);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
              />
            </div>
          </div>
        </section>

        {/* SYMPTOM SELECTION */}
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            2. Select Observed Symptoms
          </h2>

          <p className="mt-2 text-gray-500">
            You may select more than one symptom.
          </p>

          <input
            type="search"
            aria-label="Search symptoms"
            placeholder="🔍 Search symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-6 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
          />

          {/* CATEGORY FILTER */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === item
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-800 hover:bg-green-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* SYMPTOM BUTTONS */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSymptoms.map((symptom) => {
              const selected = selectedSymptoms.includes(
                symptom.name
              );

              return (
                <button
                  key={symptom.name}
                  type="button"
                  onClick={() => toggleSymptom(symptom.name)}
                  aria-pressed={selected}
                  className={`rounded-xl border-2 p-4 text-left font-medium transition ${
                    selected
                      ? "border-green-600 bg-green-100 text-green-900"
                      : "border-gray-200 bg-white hover:border-green-300"
                  }`}
                >
                  <span className="mr-2">
                    {selected ? "☑" : "☐"}
                  </span>

                  {symptom.name}
                </button>
              );
            })}
          </div>

          {filteredSymptoms.length === 0 && (
            <p className="mt-6 text-gray-500">
              No matching symptoms found. You can
              describe other symptoms in the notes below.
            </p>
          )}

          <div className="mt-7 rounded-xl bg-green-50 p-5">
            <h3 className="font-bold text-green-900">
              Selected Symptoms ({selectedSymptoms.length})
            </h3>

            {selectedSymptoms.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                No symptoms selected yet.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    aria-label={`Remove ${symptom}`}
                    className="rounded-full bg-green-700 px-4 py-2 text-sm text-white"
                  >
                    {symptom} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* IMMEDIATE EMERGENCY ALERT */}
          {hasEmergency && (
            <div
              role="alert"
              className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-5"
            >
              <h3 className="font-bold text-red-800">
                🚨 Emergency Warning Sign Selected
              </h3>

              <p className="mt-2 text-red-700">
                Seek immediate veterinary care.
                Do not wait for a symptom checker result.
              </p>
            </div>
          )}
        </section>

        {/* ADDITIONAL INFORMATION */}
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            3. Additional Information
          </h2>

          <div className="mt-6">
            <label
              htmlFor="duration"
              className="font-semibold"
            >
              How long have you noticed the symptoms?
            </label>

            <select
              id="duration"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setResult(null);
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-4"
            >
              <option value="">Select duration</option>
              <option value="Just started">
                Just started
              </option>
              <option value="Less than 24 hours">
                Less than 24 hours
              </option>
              <option value="1-2 days">
                1-2 days
              </option>
              <option value="3 days or longer">
                3 days or longer
              </option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="font-semibold">
              Additional Observations (Optional)
            </label>

            <textarea
              id="notes"
              rows="4"
              maxLength={1500}
              placeholder="Describe other symptoms, behavior changes, or concerns..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setResult(null);
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
            />
          </div>

          {error && (
            <p role="alert" className="mt-5 text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-7 w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-bold text-white hover:bg-green-800"
          >
            Review Symptoms →
          </button>
        </section>
      </form>

      {/* RESULTS */}
      {result && (
        <section className="mt-8 rounded-3xl border border-green-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            🐾 Pet Symptom Summary
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            This is a summary of your inputs, not an
            AI diagnosis or medical assessment.
          </p>

          <div className="mt-6 space-y-3">
            <p><strong>Pet:</strong> {result.petName}</p>
            <p><strong>Type:</strong> {result.petType}</p>
            <p><strong>Age:</strong> {result.petAge}</p>
            <p><strong>Duration:</strong> {result.duration}</p>

            <div>
              <strong>Symptoms:</strong>
              <ul className="mt-2 list-inside list-disc">
                {result.symptoms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {result.notes && (
              <p><strong>Notes:</strong> {result.notes}</p>
            )}
          </div>

          <div
            className={`mt-6 rounded-xl p-5 ${
              result.emergency
                ? "bg-red-50 text-red-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            <h3 className="font-bold">
              {result.emergency
                ? "🚨 Seek Immediate Veterinary Care"
                : "Veterinary Guidance Reminder"}
            </h3>

            <p className="mt-2">
              {result.emergency
                ? "One or more selected symptoms are emergency warning signs. Contact an emergency veterinarian immediately."
                : "The selected symptoms alone cannot establish a diagnosis or rule out an emergency. Contact a veterinarian for advice, particularly if symptoms persist or worsen."}
            </p>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            AI analysis and database saving will be added
            in upcoming development steps.
          </p>
        </section>
      )}
    </main>
  );
}

export default SymptomChecker;
