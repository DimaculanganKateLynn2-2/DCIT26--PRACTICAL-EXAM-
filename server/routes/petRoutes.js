const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const HealthRecord = require('../models/HealthRecord');
const router = express.Router();

function validatePet(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const breed = typeof body.breed === 'string' ? body.breed.trim() : '';
  const age = Number(body.age);
  const sex = body.sex ?? 'Unknown';
  if (!name || name.length > 50) return { error: 'Enter a valid pet name.' };
  if (!['Dog', 'Cat'].includes(body.species)) return { error: 'Select Dog or Cat.' };
  if (breed.length > 60) return { error: 'Breed is too long.' };
  if (body.age === '' || body.age == null || !Number.isFinite(age) || age < 0 || age > 35) {
    return { error: 'Enter a valid pet age.' };
  }
  if (!['Male', 'Female', 'Unknown'].includes(sex)) return { error: 'Invalid pet sex.' };
  return { data: { name, species: body.species, breed, age, sex } };
}

router.get('/', async (req, res, next) => {
  try { res.json(await Pet.find({ owner: req.user._id }).sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const checked = validatePet(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    res.status(201).json(await Pet.create({ ...checked.data, owner: req.user._id }));
  } catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid pet ID.' });
    const checked = validatePet(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const pet = await Pet.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, checked.data,
      { new: true, runValidators: true }
    );
    if (!pet) return res.status(404).json({ message: 'Pet not found.' });
    res.json(pet);
  } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid pet ID.' });
    const pet = await Pet.findOne({ _id: req.params.id, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found.' });
    const hasHistory = await HealthRecord.exists({ pet: pet._id, owner: req.user._id });
    if (hasHistory) return res.status(409).json({ message: 'Delete this pet’s health records before deleting the profile.' });
    await Pet.deleteOne({ _id: pet._id, owner: req.user._id });
    res.json({ message: 'Pet deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;
