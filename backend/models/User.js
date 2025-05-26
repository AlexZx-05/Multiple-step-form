const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profilePhoto: String,          // file path or base64 string
  username: { type: String, unique: true, required: true },
  passwordHash: String,
  profession: String,
  companyName: String,
  addressLine1: String,
  country: String,
  state: String,
  city: String,
  subscriptionPlan: String,
  newsletter: Boolean,
  // add more fields like gender, DOB if needed
});

module.exports = mongoose.model('User', userSchema);
