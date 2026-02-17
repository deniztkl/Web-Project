const mongoose = require('mongoose');

const museumSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name_tr: { type: String, required: true },
  name_en: { type: String, required: true },
  description_tr: { type: String, required: true },
  description_en: { type: String, required: true },
  imageUrl: { type: String, required: true },
  
  section1Title_tr: { type: String },
  section1Title_en: { type: String },
  section1Content_tr: { type: String },
  section1Content_en: { type: String },

  section2Title_tr: { type: String },
  section2Title_en: { type: String },
  section2Content_tr: { type: String },
  section2Content_en: { type: String },

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
  }
});

museumSchema.index({ location: '2dsphere' });
const Museum = mongoose.model('Museum', museumSchema);
module.exports = Museum;