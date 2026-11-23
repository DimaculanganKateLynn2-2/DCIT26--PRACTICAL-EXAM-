
import { useEffect, useState } from "react";
import {
  getPets,
  createPet,
  updatePet,
  deletePet,
} from "../services/petApi";

const emptyForm = {
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  sex: "Unknown",
};

function MyPets() {
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // Retrieve pets from MongoDB when the page opens
  useEffect(() => {
    const controller = new AbortController();

    async function loadPets() {
      try {
        const records = await getPets(controller.signal);

        if (!Array.isArray(records)) {
          throw new Error("Invalid server response.");
        }

        setPets(records);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            "Unable to load pets. Check your backend connection."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPets();

    return () => controller.abort();
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  }

  // Add or update a pet in MongoDB
  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const age = Number(form.age);

    if (!name || name.length > 50) {
      setError("Please enter a valid pet name.");
      return;
    }

    if (
      form.age === "" ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > 35
    ) {
      setError("Enter a valid age between 0 and 35.");
      return;
    }

    const petData = {
      name,
      species: form.species,
      breed: form.breed.trim(),
      age,
      sex: form.sex,
    };

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await updatePet(editingId, petData);

        setPets((previous) =>
          previous.map((pet) =>
            pet._id === editingId ? updated : pet
          )
        );
      } else {
        const created = await createPet(petData);

        setPets((previous) => [created, ...previous]);
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save pet.");
    } finally {
      setSaving(false);
    }
  }

  // Load an existing pet into the form
  function handleEdit(pet) {
    setEditingId(pet._id);

    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: String(pet.age),
      sex: pet.sex || "Unknown",
    });

    setError("");

    document
      .getElementById("pet-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // Delete a pet from MongoDB
  async function handleDelete(pet) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${pet.name}?`
    );

    if (!confirmed) return;

    setDeletingId(pet._id);
    setError("");

    try {
      await deletePet(pet._id);

      setPets((previous) =>
        previous.filter((item) => item._id !== pet._id)
      );

      if (editingId === pet._id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete pet.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <span className="font-semibold text-green-700">
            🐾 PET PROFILE MANAGEMENT
          </span>

          <h1 className="mt-3 text-4xl font-bold text-green-900">
            My Pets
          </h1>

          <p className="mt-3 text-gray-600">
            Register and manage your dogs and cats.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* PET FORM */}
          <section
            id="pet-form"
            className="h-fit rounded-3xl bg-white p-7 shadow-sm lg:col-span-1"
          >
            <h2 className="text-2xl font-bold text-green-900">
              {editingId ? "Edit Pet Profile" : "Register a Pet"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Enter your pet's information.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="pet-name"
                  className="font-semibold"
                >
                  Pet Name *
                </label>

                <input
                  id="pet-name"
                  type="text"
                  required
                  maxLength={50}
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="Example: Max"
                  className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <p className="font-semibold">Pet Type *</p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {["Dog", "Cat"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={form.species === type}
                      onClick={() =>
                        updateField("species", type)
                      }
                      className={`rounded-xl border-2 p-4 ${
                        form.species === type
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="text-3xl">
                        {type === "Dog" ? "🐶" : "🐱"}
                      </div>
                      <span className="font-semibold text-green-900">
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="pet-breed"
                  className="font-semibold"
                >
                  Breed (Optional)
                </label>

                <input
                  id="pet-breed"
                  type="text"
                  maxLength={60}
                  value={form.breed}
                  onChange={(e) =>
                    updateField("breed", e.target.value)
                  }
                  placeholder="Example: Aspin"
                  className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="pet-age"
                  className="font-semibold"
                >
                  Age in Years *
                </label>

                <input
                  id="pet-age"
                  type="number"
                  min="0"
                  max="35"
                  step="0.1"
                  required
                  value={form.age}
                  onChange={(e) =>
                    updateField("age", e.target.value)
                  }
                  placeholder="Example: 2"
                  className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="pet-sex"
                  className="font-semibold"
                >
                  Sex
                </label>

                <select
                  id="pet-sex"
                  value={form.sex}
                  onChange={(e) =>
                    updateField("sex", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-green-700 px-5 py-4 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "+ Add Pet"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </section>

          {/* REGISTERED PETS */}
          <section className="lg:col-span-2">

            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-green-900">
                Registered Pets
              </h2>

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                {pets.length} Pets
              </span>
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-12 text-center">
                <p role="status" className="text-gray-500">
                  Loading pet profiles...
                </p>
              </div>
            ) : pets.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
                <div className="text-6xl">🐾</div>

                <h3 className="mt-5 text-xl font-bold text-green-900">
                  No Pets Registered Yet
                </h3>

                <p className="mt-3 text-gray-500">
                  Add your first pet using the form.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {pets.map((pet) => (
                  <article
                    key={pet._id}
                    className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div className="rounded-2xl bg-green-50 p-4 text-4xl">
                        {pet.species === "Dog" ? "🐶" : "🐱"}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-green-900">
                          {pet.name}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {pet.species}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl bg-green-50 p-5 text-sm text-gray-700">
                      <p>
                        <strong>Breed:</strong>{" "}
                        {pet.breed || "Not specified"}
                      </p>

                      <p>
                        <strong>Age:</strong>{" "}
                        {pet.age} years
                      </p>

                      <p>
                        <strong>Sex:</strong> {pet.sex}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(pet)}
                        disabled={saving || deletingId !== null}
                        className="flex-1 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(pet)}
                        disabled={saving || deletingId !== null}
                        className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === pet._id
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Development version. Pet profiles are stored
          in MongoDB. Account authentication and
          access controls are still being developed.
        </p>
      </div>
    </main>
  );
}

export default MyPets;
