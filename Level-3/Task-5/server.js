const express = require("express");
const path = require("path");
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Data file path
const dataFile = path.join(__dirname, 'data', 'products.json');

// Initialize products array
let products = [];

// Load products from file
try {
    if (fs.existsSync(dataFile)) {
        const data = fs.readFileSync(dataFile, 'utf8');
        products = JSON.parse(data);
        console.log(`✅ Loaded ${products.length} products`);
    } else {
        // Create sample data
        products = [
            { id: 1, name: "Margherita Pizza", price: 299, category: "Pizza", inStock: true },
            { id: 2, name: "Grilled Burger", price: 199, category: "Burger", inStock: true },
            { id: 3, name: "Creamy Pasta", price: 249, category: "Pasta", inStock: false }
        ];
        // Save to file
        fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
        console.log("✅ Created sample products");
    }
} catch (error) {
    console.error("Error loading products:", error);
    products = [];
}

// Save products helper
function saveProducts() {
    fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

// ===== VIEW ROUTES =====
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/products", (req, res) => {
    res.render("products", { products });
});

// ===== API ROUTES =====

// GET all products
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// GET single product
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    res.json({
        success: true,
        data: product
    });
});

// POST create product
app.post('/api/products', (req, res) => {
    const { name, price, category, inStock } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({
            success: false,
            message: 'Name and price are required'
        });
    }
    
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name: name,
        price: parseFloat(price),
        category: category || 'General',
        inStock: inStock !== undefined ? inStock : true
    };
    
    products.push(newProduct);
    saveProducts();
    
    res.status(201).json({
        success: true,
        message: 'Product created',
        data: newProduct
    });
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    const { name, price, category, inStock } = req.body;
    
    products[index] = {
        ...products[index],
        name: name || products[index].name,
        price: price ? parseFloat(price) : products[index].price,
        category: category || products[index].category,
        inStock: inStock !== undefined ? inStock : products[index].inStock
    };
    
    saveProducts();
    
    res.json({
        success: true,
        message: 'Product updated',
        data: products[index]
    });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }
    
    products.splice(index, 1);
    saveProducts();
    
    res.json({
        success: true,
        message: 'Product deleted'
    });
});

// Search products
app.get('/api/search/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    const results = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    
    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    const inStock = products.filter(p => p.inStock).length;
    const categories = [...new Set(products.map(p => p.category))];
    
    res.json({
        success: true,
        data: {
            totalProducts,
            totalValue,
            inStock,
            outOfStock: totalProducts - inStock,
            categories
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    
});
