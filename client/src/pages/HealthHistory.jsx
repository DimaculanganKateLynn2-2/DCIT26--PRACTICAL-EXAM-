
import { useEffect, useState } from "react";

import {
  getHealthRecords,
  deleteHealthRecord,
} from "../services/healthRecordApi";

function HealthHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load health records from MongoDB
  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      setLoading(true);

      try {
        const data = await getHealthRecords(
          controller.signal
        );

        if (!Array.isArray(data)) {
          throw new Error("Invalid server response.");
        }

        if (!controller.signal.aborted) {
          setRecords(data);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || "Failed to load health records."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => controller.abort();
  }, [refreshKey]);

  // Delete a health record
  async function handleDelete(record) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this health record?"
    );

    if (!confirmed) return;

    setDeletingId(record._id);
    setError("");

    try {
      await deleteHealthRecord(record._id);

      setRecords((previous) =>
        previous.filter(
          (item) => item._id !== record._id
        )
      );
    } catch (err) {
      setError(
        err.message || "Failed to delete health record."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "Unknown date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-green-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <section className="mb-8">
          <span className="font-semibold text-green-700">
            🐾 PET HEALTH MONITORING
          </span>

          <h1 className="mt-3 text-4xl font-bold text-green-900">
            Pet Health History
          </h1>

          <p className="mt-3 text-gray-600">
            Review previously recorded symptoms,
            health observations, and important notes
            about your pets.
          </p>
        </section>

        {/* INFORMATION NOTICE */}
        <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">
            Important Reminder
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Health history records are based on
            user-reported observations. They are not
            veterinary diagnoses. If your pet is showing
            emergency warning signs, seek immediate
            veterinary attention.
          </p>
        </section>

        {/* HEALTH HISTORY SECTION */}
        <section className="rounded-3xl bg-white p-7 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                Recorded Health Observations
              </h2>

              <p className="mt-2 text-gray-500">
                Saved records from MongoDB.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                {records.length} Records
              </span>

              <button
                type="button"
                onClick={() =>
                  setRefreshKey((previous) => previous + 1)
                }
                disabled={loading}
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              {error}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="py-16 text-center">
              <p role="status" className="text-gray-500">
                Loading health records...
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-6xl">📋</div>

              <h3 className="mt-5 text-xl font-bold text-green-900">
                No Health Records Found
              </h3>

              <p className="mt-3 text-gray-500">
                No saved observations are available.
                Records will appear here once created.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2">

              {records.map((record) => (
                <article
                  key={record._id}
                  className="rounded-2xl border border-green-100 bg-green-50 p-6"
                >

                  {/* PET NAME */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-green-900">
                        🐾 {record.pet?.name || "Pet Unavailable"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {record.pet?.species || "Unknown Pet Type"}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-green-800">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>

                  {/* SYMPTOMS */}
                  <div className="mt-6">
                    <h4 className="font-bold text-green-900">
                      Observed Symptoms
                    </h4>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(record.symptoms || []).map(
                        (symptom, index) => (
                          <span
                            key={`${symptom}-${index}`}
                            className="rounded-full bg-white px-3 py-2 text-sm text-green-800"
                          >
                            {symptom}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* DURATION */}
                  <div className="mt-5">
                    <h4 className="font-bold text-green-900">
                      Symptom Duration
                    </h4>

                    <p className="mt-2 text-gray-700">
                      {record.duration}
                    </p>
                  </div>

                  {/* NOTES */}
                  <div className="mt-5">
                    <h4 className="font-bold text-green-900">
                      Observation Notes
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap break-words text-gray-700">
                      {record.notes || "No additional notes."}
                    </p>
                  </div>

                  {/* EMERGENCY FLAG */}
                  {record.emergencyFlag && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      <h4 className="font-bold text-red-800">
                        🚨 Emergency Warning Sign Recorded
                      </h4>

                      <p className="mt-2 text-sm text-red-700">
                        A predefined emergency symptom
                        was selected for this observation.
                        If it is occurring now, seek
                        emergency veterinary care.
                      </p>
                    </div>
                  )}

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(record)}
                    className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === record._id
                      ? "Deleting..."
                      : "🗑 Delete Record"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-gray-500">
          Development version: use synthetic test data only.
          User authentication and record ownership protection
          will be added before public deployment.
        </p>

      </div>
    </main>
  );
}

export default HealthHistory;
