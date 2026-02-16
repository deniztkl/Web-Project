const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  visitedMuseums: [{ type: String }],
  wishlist: [{ type: String }]
});

module.exports = mongoose.model('User', userSchema);
