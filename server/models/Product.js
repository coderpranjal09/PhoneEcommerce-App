const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  phoneName: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  lotName: {
    type: String,
    required: true,
    trim: true,
  },
  specifications: {
    type: String,
    trim: true,
  },
  channelPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  ssPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  floatedPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  grade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'Refurbished'],
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

productSchema.index({ phoneName: 'text', brand: 'text', lotName: 'text', key: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;