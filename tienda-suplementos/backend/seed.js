// backend/seed.js
// Script para poblar la base de datos con productos de ejemplo

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  {
    name: 'Whey Protein Premium',
    price: 89.99,
    image: '/images/whey-protein.jpg',
    category: 'Proteínas',
    description: 'Proteína de suero de leche de alta calidad para recuperación muscular',
    stock: 50,
    rating: 4.8
  },
  {
    name: 'Creatina Monohidrato',
    price: 24.99,
    image: '/images/creatine.jpg',
    category: 'Creatina',
    description: 'Creatina pura para aumentar fuerza y masa muscular',
    stock: 40,
    rating: 4.6
  },
  {
    name: 'BCAA 2:1:1',
    price: 34.99,
    image: '/images/bcaa.jpg',
    category: 'Aminoácidos',
    description: 'Aminoácidos de cadena ramificada para recuperación',
    stock: 30,
    rating: 4.7
  },
  {
    name: 'Pre-Workout Energy',
    price: 39.99,
    image: '/images/preworkout.jpg',
    category: 'Pre-Workout',
    description: 'Energía y concentración para entrenamientos intensos',
    stock: 0,
    rating: 4.5
  },
  {
    name: 'Omega 3 Fish Oil',
    price: 19.99,
    image: '/images/omega3.jpg',
    category: 'Vitaminas',
    description: 'Aceite de pescado rico en Omega 3 para salud cardiovascular',
    stock: 60,
    rating: 4.4
  },
  {
    name: 'Multivitamínico Completo',
    price: 29.99,
    image: '/images/multivitamin.jpg',
    category: 'Vitaminas',
    description: 'Complejo vitamínico para deportistas',
    stock: 70,
    rating: 4.3
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB');

    await Product.deleteMany();
    await Product.insertMany(products);
    console.log('Productos insertados correctamente');
    process.exit();
  } catch (error) {
    console.error('Error al poblar productos:', error);
    process.exit(1);
  }
}

seedProducts();
