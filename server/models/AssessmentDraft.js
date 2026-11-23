const mongoose = require('mongoose');
const draftSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  petSnapshot: { name: String, species: String, breed: String, age: Number, sex: String },
  symptoms: [{ type: String, trim: true }],
  symptomDetails: [{ name: String, severity: String }],
  duration: String,
  notes: String,
  emergencyFlag: Boolean,
  aiReport: { type: mongoose.Schema.Types.Mixed, required: true },
  aiModel: String,
  savedRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthRecord', default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
module.exports = mongoose.model('AssessmentDraft', draftSchema);
