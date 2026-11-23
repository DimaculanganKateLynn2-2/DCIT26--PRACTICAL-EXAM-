
const express = require("express");
const mongoose = require("mongoose");
const Pet = require("../models/Pet");

const router = express.Router();

// Validate incoming pet data
function validatePet(body) {
  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const breed =
    typeof body.breed === "string"
      ? body.breed.trim()
      : "";

  const age = Number(body.age);

  if (!name || name.length > 50) {
    return { error: "Enter a valid pet name." };
  }

  if (!["Dog", "Cat"].includes(body.species)) {
    return { error: "Select Dog or Cat." };
  }

  if (breed.length > 60) {
    return { error: "Breed is too long." };
  }

  if (
    body.age === "" ||
    body.age == null ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 35
  ) {
    return { error: "Enter a valid pet age." };
  }

  const sex = body.sex ?? "Unknown";

  if (!["Male", "Female", "Unknown"].includes(sex)) {
    return { error: "Invalid pet sex." };
  }

  return {
    data: {
      name,
      species: body.species,
      breed,
      age,
      sex,
    },
  };
}

// READ - Get all pets
router.get("/", async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 });
    res.json(pets);
  } catch {
    res.status(500).json({
      message: "Failed to load pets.",
    });
  }
});

// CREATE - Add new pet
router.post("/", async (req, res) => {
  try {
    const result = validatePet(req.body);

    if (result.error) {
      return res.status(400).json({
        message: result.error,
      });
    }

    const pet = await Pet.create(result.data);

    res.status(201).json(pet);
  } catch {
    res.status(500).json({
      message: "Failed to add pet.",
    });
  }
});

// UPDATE - Edit pet
router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid pet ID.",
    });
  }

  const result = validatePet(req.body);

  if (result.error) {
    return res.status(400).json({
      message: result.error,
    });
  }

  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      result.data,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found.",
      });
    }

    res.json(pet);
  } catch {
    res.status(500).json({
      message: "Failed to update pet.",
    });
  }
});

// DELETE - Remove pet
router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid pet ID.",
    });
  }

  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found.",
      });
    }

    res.json({
      message: "Pet deleted successfully.",
    });
  } catch {
    res.status(500).json({
      message: "Failed to delete pet.",
    });
  }
});

module.exports = router;
