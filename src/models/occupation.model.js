// /models/Occupation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const occupationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Occupation', occupationSchema);
