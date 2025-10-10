const mongoose = require('mongoose');

const museumSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  location: {
    type: { 
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

museumSchema.index({ location: '2dsphere' });
const Museum = mongoose.model('Museum', museumSchema);
module.exports = Museum;
