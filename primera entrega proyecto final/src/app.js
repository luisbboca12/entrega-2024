const express = require('express');
const {Server}= require('socket.io');
const exphbs = require('express-handlebars').create;
const path = require('path');

///importaciones
const { productRouter, productManager } = require('./rutas/products');
const {cartsRouter} = require('./rutas/carts');

const PORT = process.env.PORT || 3000;
const app = express();

/// Inciar servidor
const serverExpress = app.listen(PORT, () => {console.log(`Servidor Express iniciado en http://localhost:${PORT}`)});
const io = new Server(serverExpress)

// Configuración de Handlebars
app.engine('.handlebars', exphbs({ extname: '.handlebars' }).engine);
app.set('view engine', '.handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas

app.use('/api/products', productRouter);
app.use('/api/carts', cartsRouter);
 
// Ruta para la vista index.handlebars
app.get('/', (req, res) => {
  const allProducts = productManager.getAllProducts();
  res.render('index', { products: allProducts });
});

// Ruta para la vista en tiempo real con websockets
app.get('/realtimeproducts', (req, res) => {
  const allProducts = productManager.getAllProducts();
  res.render('realTimeProducts', { products: allProducts });
});

// Configuración de WebSocket
io.on('connection', (socket) => {
  console.log('Usuario conectado');
  //npm install -g nodemon
  socket.emit('actualizarProductos',productManager.getAllProducts())

  // Escucha eventos desde el cliente para agregar un nuevo producto
  socket.on('productoNuevo', (nuevoProducto) => {
    
    const nuevoProductoId = productManager.addProduct(nuevoProducto);
    console.log(`Nuevo producto agregado con ID: ${nuevoProductoId}`);

  
    io.emit('actualizarProductos', productManager.getAllProducts());
  });

  // Escucha eventos desde el cliente para eliminar un producto
  socket.on('productoEliminado', (productId) => {
   
    productManager.removeProduct(productId);

    // Actualiza la lista de productos 
    io.emit('actualizarProductos', productManager.getAllProducts());
  });

  // Maneja la desconexión del usuario
  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});
