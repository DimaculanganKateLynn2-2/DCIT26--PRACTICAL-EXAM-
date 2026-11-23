
const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    species: {
      type: String,
      required: true,
      enum: ["Dog", "Cat"],
    },

    breed: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 35,
    },

    sex: {
      type: String,
      enum: ["Male", "Female", "Unknown"],
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);
