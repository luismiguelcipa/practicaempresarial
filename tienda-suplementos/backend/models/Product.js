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
  // Tamaño base obligatorio (ej: '4 libras', '400g', '30 serv'). Sirve cuando no hay variantes
  baseSize: {
    type: String,
    required: [true, 'El tamaño base es requerido']
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
  // Variantes de presentación (tamaños) opcionales. Si existe al menos una variante, el precio mostrado al usuario
  // se toma de la variante seleccionada. Cada variante puede tener su propia imagen y stock.
  variants: [{
    size: { type: String, trim: true, required: true }, // ej: '2 libras', '4 libras'
    price: { type: Number, required: true, min: [0, 'El precio no puede ser negativo'] },
    image: { type: String }, // opcional, fallback a image principal
    stock: { type: Number, min: [0, 'El stock no puede ser negativo'], default: 0 }
  }],
  // Sabores opcionales. Si length <= 1 no se muestra selector de sabor.
  flavors: [{ type: String, trim: true }],
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
