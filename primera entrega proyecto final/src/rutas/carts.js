const express = require('express');
const cartsRouter = express.Router();
const fs = require('fs');

class CartManager {
  constructor(io) {
    this.filePath = './src/data/carrito.json';
    this.carts = this.loadCarts();
    this.io = io;
  }

  loadCarts() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al cargar carritos:', error.message);
      return [];
    }
  }

  saveCarts() {
    try {
      const data = JSON.stringify(this.carts, null, 2);
      fs.writeFileSync(this.filePath, data);
    } catch (error) {
      console.error('Error al guardar carritos:', error.message);
    }
  }

  createCart() {
    const newCart = { id: Date.now().toString(), products: [] };
    this.carts.push(newCart);
    this.saveCarts();
    return newCart.id;
  }
}

const cartManager = new CartManager();

// Crear un nuevo carritoo
cartsRouter.post('/', (req, res) => {
  const cartId = cartManager.createCart();
  res.json({ message: 'Carrito creado exitosamente', cartId });

  // Emitir evento a todos los clientes conectados para actualizar la lista de productos
  cartManager.io.emit('actualizarProductos', productManager.getAllProducts());
});

module.exports = { cartsRouter, cartManager };