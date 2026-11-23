const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
  symptoms: {
    type: [{ type: String, trim: true, maxlength: 100 }],
    required: true,
    validate: {
      validator: value => Array.isArray(value) && value.length >= 1 && value.length <= 16,
      message: 'Select 1 to 16 symptoms.',
    },
  },
  duration: {
    type: String, required: true,
    enum: ['Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure'],
  },
  notes: { type: String, trim: true, maxlength: 1500, default: '' },
  emergencyFlag: { type: Boolean, default: false },
}, { timestamps: true });

healthRecordSchema.index({ owner: 1, createdAt: -1 });
module.exports = mongoose.model('HealthRecord', healthRecordSchema);
