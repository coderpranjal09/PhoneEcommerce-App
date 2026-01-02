const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { phoneName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { lotName: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Product key must be unique' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // If key is being updated, check for uniqueness
      if (req.body.key && req.body.key !== product.key) {
        const existingProduct = await Product.findOne({ key: req.body.key });
        if (existingProduct) {
          return res.status(400).json({ message: 'Product key must be unique' });
        }
      }

      Object.assign(product, req.body);
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const dellAllProduct = async(req,res)=>{

  try{
    const result = await Product.deleteMany({});
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deleteCount: result.deletedCount
    });
  }
  catch(error){
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting products',
      error: error.message // Include error message for debugging
    });
  }
}


module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  dellAllProduct
};