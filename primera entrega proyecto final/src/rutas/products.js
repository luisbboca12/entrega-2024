const express = require('express');
const productRouter = express.Router();
const fs = require('fs');

class ProductManager {
  constructor(io) {
    this.filePath = './src/data/productos.json';
    this.products = this.loadProducts();
    this.io = io;
  }

  loadProducts() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al cargar productos:', error.message);
      return [];
    }
  }

  saveProducts() {
    try {
      const data = JSON.stringify(this.products, null, 2);
      fs.writeFileSync(this.filePath, data);
    } catch (error) {
      console.error('Error al guardar productos:', error.message);
    }
  }

  getAllProducts() {
    return this.products;
  }

  getProductById(productId) {
    return this.products.find(product => product.id === productId);
  }

  updateProduct(productId, updatedFields) {
    const productIndex = this.products.findIndex(product => product.id === productId);

    if (productIndex !== -1) {
      this.products[productIndex] = { ...this.products[productIndex], ...updatedFields };
      this.saveProducts();
      return true;
    }

    return false;
  }
}

const productManager = new ProductManager();

// Actualizar un producto
productRouter.put('/:pid', (req, res) => {
  const productId = req.params.pid;
  const updatedFields = req.body;

  if (productManager.updateProduct(productId, updatedFields)) {
    res.json({ message: 'Producto actualizado exitosamente' });

    // Emitir evento a todos los clientes conectados para actualizar la lista de productos
    productManager.io.emit('actualizarProductos', productManager.getAllProducts());
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// Obtener productos de un carrito
productRouter.get('/:cid', (req, res) => {
  const cartId = req.params.cid;

  const cart = cartManager.carts.find(cart => cart.id === cartId);

  if (cart) {
    const cartProducts = cart.products.map(productId => productManager.getProductById(productId));
    res.json({ products: cartProducts });
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

// Eliminar un producto
productRouter.delete('/:pid', (req, res) => {
  const productId = req.params.pid;

  // Eliminar el producto de todos los carritos
  cartManager.carts.forEach(cart => {
    const productIndex = cart.products.indexOf(productId);
    if (productIndex !== -1) {
      cart.products.splice(productIndex, 1);
    }
  });

  // Eliminar el producto de la lista de productos
  const productIndex = productManager.products.findIndex(product => product.id === productId);
  if (productIndex !== -1) {
    productManager.products.splice(productIndex, 1);
    productManager.saveProducts();
    res.json({ message: 'Producto eliminado exitosamente' });
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

module.exports = { productRouter, productManager };
