const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/products  (listado con filtros / paginación / búsqueda)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      includeInactive = 'false'
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (includeInactive !== 'true') {
      // Incluir productos legacy que no tengan el campo isActive aún, además de los activos
      query.$or = [
        { isActive: true },
        { isActive: { $exists: false } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const numericLimit = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * numericLimit;

    const findPromise = Product.find(query)
      .sort(sort.split(',').join(' '))
      .skip(skip)
      .limit(numericLimit);
    const countPromise = Product.countDocuments(query);

    const [products, total] = await Promise.all([findPromise, countPromise]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / numericLimit) || 1,
        limit: numericLimit,
        total,
        hasNext: Number(page) * numericLimit < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error listando productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// GET /api/products/:id (detalle)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: 'ID inválido' });
  }
});

// POST /api/products (crear) - admin
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    // Normalizar variantes y sabores opcionales
    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants.filter(v => v && v.size && v.price !== undefined && v.price !== null);
    }
    if (Array.isArray(req.body.flavors)) {
      req.body.flavors = req.body.flavors.filter(f => typeof f === 'string' && f.trim() !== '');
    }
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id (actualizar) - admin
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants.filter(v => v && v.size && v.price !== undefined && v.price !== null);
    }
    if (Array.isArray(req.body.flavors)) {
      req.body.flavors = req.body.flavors.filter(f => typeof f === 'string' && f.trim() !== '');
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id (hard delete) - admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, message: 'Producto eliminado permanentemente', data: { _id: product._id } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
