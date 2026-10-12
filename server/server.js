
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// PRODUCT MODEL
const Product = mongoose.model(
  'Product',
  new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number'
      }
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' }
  })
);

// ORDER MODEL
const Order = mongoose.model(
  'Order',
  new mongoose.Schema(
    {
      customer: {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true }
      },
      items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
          },
          name: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
          quantity: { type: Number, required: true, min: 1 }
        }
      ],
      total: { type: Number, required: true, min: 0 },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
      }
    },
    { timestamps: true }
  )
);

// HOME ROUTE
app.get('/', (req, res) => {
  res.send('E-commerce backend is running!');
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? 'Connected'
        : 'Disconnected'
  });
});

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({
      message: 'Failed to fetch products'
    });
  }
});

// ADD A PRODUCT
app.post('/api/products', async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      stock,
      description,
      image
    } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof category !== 'string' ||
      !category.trim() ||
      price === '' ||
      price === null ||
      price === undefined ||
      stock === '' ||
      stock === null ||
      stock === undefined
    ) {
      return res.status(400).json({
        message: 'Name, price, category, and stock are required.'
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({
        message:
          'Price must be non-negative and stock must be a non-negative whole number.'
      });
    }

    const product = await Product.create({
      name: name.trim(),
      price: parsedPrice,
      category: category.trim(),
      stock: parsedStock,
      description,
      image: typeof image === 'string' ? image.trim() : ''
    });

    res.status(201).json({
      message: 'Product added successfully!',
      product
    });
  } catch (error) {
    console.error('Add product error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid product details.',
        error: error.message
      });
    }

    res.status(500).json({
      message: 'Failed to save product.'
    });
  }
});

// SAVE AN ORDER
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items } = req.body;

    if (
      !customer ||
      typeof customer.name !== 'string' ||
      !customer.name.trim() ||
      typeof customer.phone !== 'string' ||
      !/^[0-9]{10}$/.test(customer.phone) ||
      typeof customer.address !== 'string' ||
      !customer.address.trim()
    ) {
      return res.status(400).json({
        message:
          'Enter a valid name, 10-digit phone number, and address.'
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        message: 'Your order must contain between 1 and 50 items.'
      });
    }

    const quantities = new Map();

    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          message: 'Invalid product or quantity.'
        });
      }

      const id = String(item.productId);
      quantities.set(
        id,
        (quantities.get(id) || 0) + item.quantity
      );
    }

    const productIds = [...quantities.keys()];
    const products = await Product.find({
      _id: { $in: productIds }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message: 'One or more products no longer exist.'
      });
    }

    const orderItems = [];
    let total = 0;

    for (const product of products) {
      const quantity = quantities.get(String(product._id));

      if (product.stock < quantity) {
        return res.status(409).json({
          message: `Not enough stock for ${product.name}.`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      });

      total += product.price * quantity;
    }

    const order = await Order.create({
      customer: {
        name: customer.name.trim(),
        phone: customer.phone,
        address: customer.address.trim()
      },
      items: orderItems,
      total
    });

    res.status(201).json({
      message: 'Order saved successfully!',
      orderId: order._id,
      total: order.total,
      status: order.status
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Could not save the order.'
    });
  }
});

// START SERVER AFTER CONNECTING TO MONGODB

app.get('/api/orders', async (req, res) => {
  try {
    const phone = String(req.query.phone || '').trim();

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        message: 'Please enter a valid 10-digit phone number.'
      });
    }

    const orders = await Order.find({
      'customer.phone': phone
    })
      .select('-customer.phone -customer.address')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Fetch order history error:', error);

    res.status(500).json({
      message: 'Could not fetch order history.'
    });
  }
});
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'MongoDB connection failed:',
      error.message
    );
  }
}

startServer();
