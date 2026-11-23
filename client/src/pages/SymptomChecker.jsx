import { useEffect, useRef, useState } from "react";
import { getPets } from "../services/petApi";
import { createHealthRecord } from "../services/healthRecordApi";
import AiGuidancePanel from "../components/AiGuidancePanel";

// These are observation labels, not diagnoses.
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
  { name: "Difficulty Breathing", category: "Emergency Signs", emergency: true },
  { name: "Seizures", category: "Emergency Signs", emergency: true },
  { name: "Collapse", category: "Emergency Signs", emergency: true },
  { name: "Heavy Bleeding", category: "Emergency Signs", emergency: true },
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

const emergencyNames = new Set(
  symptomOptions.filter((symptom) => symptom.emergency).map((symptom) => symptom.name)
);

function SymptomChecker() {
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState("");
  const [petId, setPetId] = useState("");

  // Used ONLY for manual entry. Registered pet details come from MongoDB.
  const [manualType, setManualType] = useState("Dog");
  const [manualName, setManualName] = useState("");
  const [manualAge, setManualAge] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPets() {
      try {
        const data = await getPets(controller.signal);
        if (!Array.isArray(data)) throw new Error("Unexpected pet data");
        if (!controller.signal.aborted) {
          setPets(data);
          setPetsError("");
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setPetsError("Could not load registered pets. Check the backend server.");
        }
      } finally {
        if (!controller.signal.aborted) setPetsLoading(false);
      }
    }

    loadPets();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const selectedPet = pets.find((pet) => pet._id === petId) || null;
  const isRegistered = Boolean(selectedPet);
  const hasEmergency = selectedSymptoms.some((symptom) => emergencyNames.has(symptom));

  const filteredSymptoms = symptomOptions.filter((symptom) => {
    const matchesSearch = symptom.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = category === "All" || symptom.category === category;
    return matchesSearch && matchesCategory;
  });

  // Any change to an observation invalidates its previously reviewed summary.
  function invalidateReview() {
    setResult(null);
    setError("");
    setSavedRecordId(null);
    setSaveMessage("");
    setSaveError("");
  }

  function choosePet(id) {
    setPetId(id);
    invalidateReview();
  }

  function toggleSymptom(name) {
    setSelectedSymptoms((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );
    invalidateReview();
  }

  function handleReview(event) {
    event.preventDefault();

    if (selectedSymptoms.length === 0) {
      setError("Please select at least one observed symptom.");
      return;
    }

    if (!duration) {
      setError("Please select how long the symptoms have lasted.");
      return;
    }

    if (petId && !selectedPet) {
      setError("That registered pet is no longer available. Please select another pet.");
      return;
    }

    if (manualAge !== "" && !isRegistered) {
      const age = Number(manualAge);
      if (!Number.isFinite(age) || age < 0 || age > 40) {
        setError("Enter a valid age between 0 and 40, or leave it blank.");
        return;
      }
    }

    const petType = selectedPet?.species || manualType;
    const petName = selectedPet?.name || manualName.trim() || "Not provided";
    const petAge = selectedPet ? String(selectedPet.age) : manualAge || "Not provided";

    setError("");
    setSavedRecordId(null);
    setSaveMessage("");
    setSaveError("");
    setResult({
      petId: selectedPet?._id || "",
      petType,
      petName,
      petAge,
      duration,
      symptoms: [...selectedSymptoms],
      notes: notes.trim(),
      emergency: hasEmergency,
    });
  }

  async function handleSaveRecord() {
    if (!result || !result.petId || savingRecord || savedRecordId) return;

    setSavingRecord(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const saved = await createHealthRecord({
        petId: result.petId,
        symptoms: result.symptoms,
        duration: result.duration,
        notes: result.notes,
      });
      setSavedRecordId(saved._id);
      setSaveMessage("Observation saved successfully! Check Health History to see it.");
    } catch (err) {
      setSaveError(err.message || "Could not save the observation.");
    } finally {
      setSavingRecord(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-gray-800">
      <div className="mb-8">
        <span className="font-semibold text-green-700">🐾 PET HEALTH & WELLNESS</span>
        <h1 className="mt-3 text-4xl font-bold text-green-900">Pet Symptom Checker</h1>
        <p className="mt-3 text-gray-600">
          Select your pet and record the symptoms you have observed.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-bold text-amber-900">Important Health Reminder</h2>
        <p className="mt-2 text-sm text-amber-800">
          This tool records observations; it does not diagnose illnesses or replace a
          veterinarian. If your pet has serious or worsening symptoms, seek veterinary care.
        </p>
      </div>

      <form onSubmit={handleReview} className="space-y-7">
        <fieldset disabled={savingRecord} className="contents">
          {/* 1. PET INFORMATION */}
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-green-900">1. Pet Information</h2>
            <p className="mt-2 text-gray-500">
              Choose a registered pet, or use manual entry without saving to Health History.
            </p>

            <div className="mt-7">
              <label htmlFor="registered-pet" className="font-semibold text-green-900">
                Select a Registered Pet
              </label>
              <select
                id="registered-pet"
                value={petId}
                onChange={(event) => choosePet(event.target.value)}
                disabled={petsLoading}
                className="mt-3 w-full rounded-xl border border-green-300 bg-white p-4 outline-none focus:border-green-600"
              >
                <option value="">Continue without registration (Manual Entry)</option>
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
              {petsLoading && <p className="mt-2 text-sm text-gray-500">Loading pets...</p>}
              {petsError && <p role="alert" className="mt-2 text-sm text-red-700">{petsError}</p>}
              {!petsLoading && !petsError && pets.length === 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  No registered pets yet. Add one on the My Pets page to save observations.
                </p>
              )}
            </div>

            {/* Registered pet: display details, DO NOT ask for them again. */}
            {selectedPet ? (
              <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl">
                    {selectedPet.species === "Dog" ? "🐶" : "🐱"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700">✓ Registered Pet</p>
                    <h3 className="mt-1 text-2xl font-bold text-green-900">
                      {selectedPet.name}
                    </h3>
                    <p className="mt-1 text-gray-600">
                      {selectedPet.species} · {selectedPet.breed || "Breed not specified"}
                      {" · "}{selectedPet.age} years old · {selectedPet.sex || "Unknown"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-green-800">
                  These details were loaded from My Pets. To change them, edit the pet profile there.
                </p>
              </div>
            ) : (
              /* Manual entry only: show pet type, name and age fields. */
              <div className="mt-7">
                <p className="font-semibold">Select Pet Type</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {["Dog", "Cat"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={manualType === type}
                      onClick={() => {
                        setManualType(type);
                        invalidateReview();
                      }}
                      className={`rounded-2xl border-2 p-5 text-center transition ${
                        manualType === type
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <span className="block text-4xl">{type === "Dog" ? "🐶" : "🐱"}</span>
                      <span className="mt-2 block font-bold">{type}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="manual-pet-name" className="font-semibold">Pet Name (Optional)</label>
                    <input
                      id="manual-pet-name"
                      type="text"
                      maxLength={60}
                      placeholder="Example: Max"
                      value={manualName}
                      onChange={(event) => {
                        setManualName(event.target.value);
                        invalidateReview();
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="manual-pet-age" className="font-semibold">Age in Years (Optional)</label>
                    <input
                      id="manual-pet-age"
                      type="number"
                      min="0"
                      max="40"
                      step="0.1"
                      placeholder="Example: 2"
                      value={manualAge}
                      onChange={(event) => {
                        setManualAge(event.target.value);
                        invalidateReview();
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Manual entries can be reviewed but cannot be saved to Health History.
                </p>
              </div>
            )}
          </section>

          {/* 2. SELECT SYMPTOMS */}
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-green-900">2. Select Observed Symptoms</h2>
            <p className="mt-2 text-gray-500">You may select more than one symptom.</p>
            <input
              type="search"
              aria-label="Search symptoms"
              placeholder="🔍 Search symptoms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-6 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
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
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSymptoms.map((symptom) => {
                const selected = selectedSymptoms.includes(symptom.name);
                return (
                  <button
                    key={symptom.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSymptom(symptom.name)}
                    className={`rounded-xl border-2 p-4 text-left font-medium transition ${
                      selected
                        ? "border-green-600 bg-green-100 text-green-900"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                  >
                    <span className="mr-2">{selected ? "☑" : "☐"}</span>
                    {symptom.name}
                  </button>
                );
              })}
            </div>
            {filteredSymptoms.length === 0 && (
              <p className="mt-6 text-gray-500">
                No matching symptoms found. You can describe other concerns in the notes below.
              </p>
            )}
            <div className="mt-7 rounded-xl bg-green-50 p-5">
              <h3 className="font-bold text-green-900">
                Selected Symptoms ({selectedSymptoms.length})
              </h3>
              {selectedSymptoms.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No symptoms selected yet.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSymptoms.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleSymptom(name)}
                      aria-label={`Remove ${name}`}
                      className="rounded-full bg-green-700 px-4 py-2 text-sm text-white"
                    >
                      {name} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            {hasEmergency && (
              <div role="alert" className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-5">
                <h3 className="font-bold text-red-800">🚨 Emergency Warning Sign Selected</h3>
                <p className="mt-2 text-red-700">
                  Seek emergency veterinary care immediately. Do not wait for this form or an AI result.
                </p>
              </div>
            )}
          </section>

          {/* 3. ADDITIONAL DETAILS */}
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-green-900">3. Additional Information</h2>
            <div className="mt-6">
              <label htmlFor="symptom-duration" className="font-semibold">
                How long have you noticed the symptoms?
              </label>
              <select
                id="symptom-duration"
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value);
                  invalidateReview();
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-4"
              >
                <option value="">Select duration</option>
                <option value="Just started">Just started</option>
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1-2 days">1-2 days</option>
                <option value="3 days or longer">3 days or longer</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
            <div className="mt-6">
              <label htmlFor="observation-notes" className="font-semibold">
                Additional Observations (Optional)
              </label>
              <textarea
                id="observation-notes"
                rows={4}
                maxLength={1500}
                placeholder="Describe behavior changes or other concerns..."
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  invalidateReview();
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-green-600"
              />
              <p className="mt-2 text-xs text-gray-500">
                The emergency warning only checks selected predefined symptoms; it does not analyze these notes.
              </p>
            </div>
            {error && <p role="alert" className="mt-5 text-red-700">{error}</p>}
            <button
              type="submit"
              className="mt-7 w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-bold text-white hover:bg-green-800"
            >
              Review Symptoms →
            </button>
          </section>
        </fieldset>
      </form>

      {/* REVIEWED SUMMARY: NOT AN AI DIAGNOSIS */}
      {result && (
        <section
          ref={resultRef}
          className="mt-8 scroll-mt-6 rounded-3xl border border-green-200 bg-white p-7 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-green-900">🐾 Pet Symptom Summary</h2>
          <p className="mt-2 text-sm text-gray-500">
            This summarizes your inputs. It is not an AI diagnosis or medical assessment.
          </p>
          <div className="mt-6 space-y-3">
            <p><strong>Pet:</strong> {result.petName}</p>
            <p><strong>Type:</strong> {result.petType}</p>
            <p><strong>Age:</strong> {result.petAge === "Not provided" ? result.petAge : `${result.petAge} years`}</p>
            <p><strong>Duration:</strong> {result.duration}</p>
            <div>
              <strong>Symptoms:</strong>
              <ul className="mt-2 list-inside list-disc">
                {result.symptoms.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            {result.notes && <p className="whitespace-pre-wrap break-words"><strong>Notes:</strong> {result.notes}</p>}
          </div>

          <div className={`mt-6 rounded-xl p-5 ${
            result.emergency ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
          }`}>
            <h3 className="font-bold">
              {result.emergency
                ? "🚨 Seek Immediate Veterinary Care"
                : "Veterinary Guidance Reminder"}
            </h3>
            <p className="mt-2">
              {result.emergency
                ? "An emergency warning sign was selected. Contact an emergency veterinarian immediately."
                : "A symptom checklist cannot determine the cause or rule out an emergency. Contact a veterinarian if you are concerned, especially for persistent or worsening symptoms."}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-green-900">Save This Observation</h3>
            <p className="mt-2 text-gray-600">
              Save these symptoms under a registered pet's MongoDB Health History.
            </p>
            {!result.petId && (
              <p className="mt-4 text-sm text-amber-700">
                Manual entries cannot be saved. Select a registered pet and review again to save.
              </p>
            )}
            {result.emergency && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
                Do not delay emergency veterinary care to save this record.
              </p>
            )}
            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={!result.petId || savingRecord || Boolean(savedRecordId)}
              className="mt-5 w-full rounded-xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingRecord
                ? "Saving Observation..."
                : savedRecordId
                ? "✓ Observation Saved"
                : "💾 Save to Health History"}
            </button>
            {saveMessage && (
              <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 font-medium text-green-800">
                {saveMessage}
              </p>
            )}
            {saveError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
                {saveError}
              </p>
            )}
          </div>
          <AiGuidancePanel observation={result} />
        </section>
      )}
    </main>
  );
}

export default SymptomChecker;
