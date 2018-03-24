const mongoose = require('mongoose');

const PasteSchema = mongoose.Schema(
{
  title:{
    type: String,
    default: "Untitled"
  },
  author:{
    type: String,
    required: true
  },
  body:{
    type: String,
    required: true
  },
  password:{
    type: String,
    default: null
  }
},
{
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model('Paste', PasteSchema);