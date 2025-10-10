
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Museum = require("../models/museum");
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function importMuseums() {
  try {
    const dataPath = path.join(__dirname, "../public/data/museums.json");
    const jsonData = fs.readFileSync(dataPath, "utf-8");
    const museums = JSON.parse(jsonData);

    await Museum.deleteMany();
    await Museum.insertMany(museums);

    console.log("Müzeler başarıyla yüklendi.");
    mongoose.disconnect();
  } catch (err) {
    console.error("Yükleme hatası:", err);
    mongoose.disconnect();
  }
}

importMuseums();