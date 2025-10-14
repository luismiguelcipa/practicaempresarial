const express = require('express');
const router = express.Router();
const Combo = require('../models/Combo');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'combo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
});

// GET todos los combos o filtrar por categoría
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    const combos = await Combo.find(filter).populate('products.productId').sort({ createdAt: -1 });
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener combos', error: error.message });
  }
});

// GET combo por ID
router.get('/:id', async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id).populate('products.productId');
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo no encontrado' });
    }
    
    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el combo', error: error.message });
  }
});

// POST crear nuevo combo (solo admin)
router.post('/', auth.protect, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, category, products, inStock, featured, rating } = req.body;
    
    const comboData = {
      name,
      description,
      price: parseFloat(price),
      category,
      inStock: inStock === 'true' || inStock === true,
      image: req.file ? `/uploads/${req.file.filename}` : '/images/default-combo.jpg'
    };
    
    // Campos opcionales
    if (originalPrice) comboData.originalPrice = parseFloat(originalPrice);
    if (discount) comboData.discount = parseFloat(discount);
    if (featured !== undefined) comboData.featured = featured === 'true' || featured === true;
    if (rating) comboData.rating = parseFloat(rating);
    if (products) {
      comboData.products = typeof products === 'string' ? JSON.parse(products) : products;
    }
    
    const combo = new Combo(comboData);
    const savedCombo = await combo.save();
    
    res.status(201).json(savedCombo);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el combo', error: error.message });
  }
});

// PUT actualizar combo (solo admin)
router.put('/:id', auth.protect, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, category, products, inStock, featured, rating } = req.body;
    
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo no encontrado' });
    }
    
    // Actualizar campos
    if (name) combo.name = name;
    if (description) combo.description = description;
    if (price) combo.price = parseFloat(price);
    if (originalPrice) combo.originalPrice = parseFloat(originalPrice);
    if (discount !== undefined) combo.discount = parseFloat(discount);
    if (category) combo.category = category;
    if (inStock !== undefined) combo.inStock = inStock === 'true' || inStock === true;
    if (featured !== undefined) combo.featured = featured === 'true' || featured === true;
    if (rating !== undefined) combo.rating = parseFloat(rating);
    if (products) {
      combo.products = typeof products === 'string' ? JSON.parse(products) : products;
    }
    if (req.file) {
      combo.image = `/uploads/${req.file.filename}`;
    }
    
    const updatedCombo = await combo.save();
    res.json(updatedCombo);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el combo', error: error.message });
  }
});

// DELETE eliminar combo (solo admin)
router.delete('/:id', auth.protect, isAdmin, async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo no encontrado' });
    }
    
    res.json({ message: 'Combo eliminado exitosamente', combo });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el combo', error: error.message });
  }
});

// GET combos destacados
router.get('/featured/list', async (req, res) => {
  try {
    const combos = await Combo.find({ featured: true, inStock: true })
      .populate('products.productId')
      .limit(10);
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener combos destacados', error: error.message });
  }
});

module.exports = router;
