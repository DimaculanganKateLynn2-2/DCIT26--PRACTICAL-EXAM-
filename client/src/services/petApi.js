
const API_URL = "http://localhost:5000/api/pets";

async function request(url, options = {}) {
  const response = await fetch(url, options);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export function getPets(signal) {
  return request(API_URL, { signal });
}

export function createPet(pet) {
  return request(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pet),
  });
}

export function updatePet(id, pet) {
  return request(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pet),
  });
}

export function deletePet(id) {
  return request(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
