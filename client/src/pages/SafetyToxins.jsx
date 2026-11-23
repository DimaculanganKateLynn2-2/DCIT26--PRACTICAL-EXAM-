
import { useState } from "react";

const toxins = [
  {
    id: 1,
    name: "Chocolate",
    icon: "🍫",
    category: "Food & Drinks",
    pets: ["Dog", "Cat"],
    description: "Chocolate contains theobromine and caffeine.",
    effects:
      "Exposure can cause vomiting, restlessness, abnormal heart rhythm, tremors, or seizures.",
    prevention:
      "Keep chocolate, cocoa powder, and chocolate-containing desserts away from pets.",
  },
  {
    id: 2,
    name: "Grapes & Raisins",
    icon: "🍇",
    category: "Food & Drinks",
    pets: ["Dog"],
    description:
      "Grapes and raisins can cause serious kidney injury in dogs.",
    effects:
      "Kidney damage can develop even when early symptoms are not obvious. The risk cannot be determined by appearance alone.",
    prevention:
      "Keep grapes, raisins, and foods containing them out of reach.",
  },
  {
    id: 3,
    name: "Xylitol",
    icon: "🍬",
    category: "Food & Drinks",
    pets: ["Dog"],
    description:
      "Xylitol is a sweetener found in certain sugar-free products.",
    effects:
      "Dogs can develop dangerously low blood sugar and potentially severe liver injury.",
    prevention:
      "Check ingredients in gum, candies, baked goods, and other sugar-free products.",
  },
  {
    id: 4,
    name: "Onions & Garlic",
    icon: "🧅",
    category: "Food & Drinks",
    pets: ["Dog", "Cat"],
    description:
      "Onions, garlic, and related plants can harm dogs and cats.",
    effects:
      "They can damage red blood cells and cause anemia. Symptoms may be delayed.",
    prevention:
      "Avoid feeding pets dishes containing onion, garlic, or their powders.",
  },
  {
    id: 5,
    name: "Coffee & Caffeine",
    icon: "☕",
    category: "Food & Drinks",
    pets: ["Dog", "Cat"],
    description:
      "Caffeine-containing drinks and products can be harmful to pets.",
    effects:
      "Possible effects include restlessness, rapid heartbeat, tremors, and seizures.",
    prevention:
      "Keep coffee, energy drinks, caffeine tablets, and coffee grounds secured.",
  },
  {
    id: 6,
    name: "Alcohol",
    icon: "🍷",
    category: "Food & Drinks",
    pets: ["Dog", "Cat"],
    description:
      "Alcoholic drinks and alcohol-containing foods can poison pets.",
    effects:
      "Exposure can lead to poor coordination, vomiting, difficulty breathing, and other serious complications.",
    prevention:
      "Never offer alcohol to pets and keep alcoholic products out of reach.",
  },
  {
    id: 7,
    name: "True Lilies & Daylilies",
    icon: "🌸",
    category: "Plants",
    pets: ["Cat"],
    description:
      "True lilies (Lilium) and daylilies (Hemerocallis) are extremely dangerous to cats.",
    effects:
      "Even small exposures, including pollen or vase water, can cause life-threatening kidney injury.",
    prevention:
      "Do not keep true lilies or daylilies in homes with cats.",
  },
  {
    id: 8,
    name: "Human Pain Medicines",
    icon: "💊",
    category: "Medicines",
    pets: ["Dog", "Cat"],
    description:
      "Human pain relievers such as ibuprofen and paracetamol may be dangerous to pets.",
    effects:
      "Depending on the drug and species, poisoning may damage the stomach, kidneys, liver, or blood cells.",
    prevention:
      "Never give human pain medication to a pet unless specifically directed by a veterinarian.",
  },
];

const categories = [
  "All",
  "Food & Drinks",
  "Plants",
  "Medicines",
];

function SafetyToxins() {
  const [search, setSearch] = useState("");
  const [petFilter, setPetFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const filteredToxins = toxins.filter((toxin) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      toxin.name.toLowerCase().includes(query) ||
      toxin.description.toLowerCase().includes(query);

    const matchesPet =
      petFilter === "All" ||
      toxin.pets.includes(petFilter);

    const matchesCategory =
      category === "All" ||
      toxin.category === category;

    return matchesSearch && matchesPet && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-green-50 px-5 py-10 text-gray-800">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <section className="mb-8">
          <span className="font-semibold text-green-700">
            🐾 PET SAFETY & WELLNESS
          </span>

          <h1 className="mt-3 text-4xl font-bold text-green-900">
            Safety & Toxins Guide
          </h1>

          <p className="mt-3 max-w-3xl text-gray-600">
            Learn about common foods, plants, and medicines
            that may be dangerous to dogs and cats.
          </p>
        </section>

        {/* EMERGENCY REMINDER */}
        <section
          role="alert"
          className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <h2 className="text-xl font-bold text-red-800">
            🚨 Suspect Your Pet Was Poisoned?
          </h2>

          <p className="mt-3 text-red-700">
            Contact a veterinarian or emergency animal
            hospital immediately. Do not wait for symptoms
            to appear. Do not induce vomiting or give
            medicines or home remedies unless a veterinary
            professional instructs you to do so.
          </p>

          <a
            href="https://www.google.com/maps/search/?api=1&query=emergency+veterinary+clinic"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
          >
            📍 Search Veterinary Clinics
          </a>
        </section>

        {/* SEARCH AND FILTER SECTION */}
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            Explore Pet Safety Information
          </h2>

          <p className="mt-2 text-gray-600">
            Search by substance name or filter by pet type
            and category.
          </p>

          {/* SEARCH BAR */}
          <div className="mt-6">
            <label
              htmlFor="toxinSearch"
              className="font-semibold text-green-900"
            >
              Search for a substance
            </label>

            <input
              id="toxinSearch"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chocolate, grapes, lilies..."
              className="mt-2 w-full rounded-xl border border-gray-300 px-5 py-4 outline-none focus:border-green-600"
            />
          </div>

          {/* PET FILTER */}
          <div className="mt-6">
            <h3 className="font-semibold text-green-900">
              Pet Type
            </h3>

            <div className="mt-3 flex flex-wrap gap-3">
              {["All", "Dog", "Cat"].map((pet) => (
                <button
                  key={pet}
                  type="button"
                  aria-pressed={petFilter === pet}
                  onClick={() => setPetFilter(pet)}
                  className={`rounded-full px-6 py-3 font-semibold transition ${
                    petFilter === pet
                      ? "bg-green-700 text-white"
                      : "bg-green-50 text-green-800 hover:bg-green-100"
                  }`}
                >
                  {pet === "Dog"
                    ? "🐶 Dog"
                    : pet === "Cat"
                    ? "🐱 Cat"
                    : "All Pets"}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY FILTER */}
          <div className="mt-6">
            <h3 className="font-semibold text-green-900">
              Categories
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    category === item
                      ? "bg-green-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-green-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-green-900">
              Common Pet Hazards
            </h2>

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
              {filteredToxins.length} Results
            </span>
          </div>

          <p className="mb-5 text-sm text-gray-600">
            This is a limited educational list, not a
            complete poison database. A substance not
            listed for a species is not necessarily safe.
          </p>

          {filteredToxins.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-700">
                No matching items found
              </p>

              <p className="mt-2 text-gray-500">
                Try a different search term or filter.
                If an exposure occurred, contact a veterinarian
                regardless of search results.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPetFilter("All");
                  setCategory("All");
                }}
                className="mt-5 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredToxins.map((toxin) => {
                const expanded = expandedId === toxin.id;

                return (
                  <article
                    key={toxin.id}
                    className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-green-50 p-4 text-4xl">
                        {toxin.icon}
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          {toxin.category}
                        </span>

                        <h3 className="mt-1 text-xl font-bold text-green-900">
                          {toxin.name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Known concern for:{" "}
                          {toxin.pets.join(" & ")}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-gray-600">
                      {toxin.description}
                    </p>

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : toxin.id
                        )
                      }
                      className="mt-6 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                    >
                      {expanded
                        ? "Hide Details ↑"
                        : "View Details →"}
                    </button>

                    {expanded && (
                      <div className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                        <div>
                          <h4 className="font-bold text-green-900">
                            Potential Health Effects
                          </h4>

                          <p className="mt-2 text-sm text-gray-600">
                            {toxin.effects}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-green-900">
                            Prevention
                          </h4>

                          <p className="mt-2 text-sm text-gray-600">
                            {toxin.prevention}
                          </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                          If exposure is suspected,
                          contact a veterinarian promptly.
                          Do not attempt home treatment.
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* EDUCATIONAL REFERENCES */}
        <section className="mt-10 rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">
            Educational References
          </h2>

          <p className="mt-3 text-gray-600">
            Learn more from established veterinary
            and animal safety organizations.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <a
              href="https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline"
            >
              ASPCA — Foods to Avoid Feeding Pets
            </a>

            <a
              href="https://www.fda.gov/animal-veterinary/animal-health-literacy/potentially-dangerous-items-your-pet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline"
            >
              FDA — Potentially Dangerous Items for Pets
            </a>

            <a
              href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/common-cat-hazards-0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline"
            >
              Cornell University — Common Cat Hazards
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Educational use only. This guide is not
            comprehensive and does not replace veterinary
            care or professional toxicology advice.
          </p>
        </section>

      </div>
    </main>
  );
}

export default SafetyToxins;
