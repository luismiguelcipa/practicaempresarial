require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');
    
    const products = await Product.find({}).limit(10);
    console.log(`\nEncontrados ${products.length} productos:`);
    console.log('================================');
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product._id}`);
      console.log(`   Nombre: ${product.name}`);
      console.log(`   Precio: $${product.price}`);
      console.log(`   SKU: ${product.sku || 'N/A'}`);
      console.log(`   Stock: ${product.stock}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();