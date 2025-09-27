const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['Proteínas', 'Creatina', 'Aminoácidos', 'Pre-Workout', 'Vitaminas', 'Otros']
  },
  image: {
    type: String,
    required: [true, 'La imagen es requerida']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'La calificación no puede ser menor a 0'],
    max: [5, 'La calificación no puede ser mayor a 5']
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices para búsquedas y filtros frecuentes
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
