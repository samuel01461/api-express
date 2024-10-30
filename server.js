require("dotenv").config();
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const authMiddleware = require("./middleware/authMiddleware");

const readData = (p) => {
    return JSON.parse(fs.readFileSync(path.join(__dirname, p), "utf-8"));
};

const writeData = (p, data) => {
    fs.writeFileSync(path.join(__dirname, p), JSON.stringify(data, null, 2));
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = readData("./data/users.json");
    const user = users.find((u) => u.username == username && u.password == password);

    if (!user) {
        return res.status(401).json({ message: "Auth error"});
    }

    const token = jwt.sign({ id: user.id, role: user.role}, process.env.JWT_SECRET, { expiresIn: "1h"});
    
    res.json({ token });
});

app.get("/products", authMiddleware, (req, res) => {
    const products = readData("./data/products.json");
    res.json(products);
});

app.get("/products/:id", authMiddleware, (req, res) => {
    const pid = parseInt(req.params.id, 10);

    const products = readData("./data/products.json");
    const findProduct = products.filter((p) => p.id === pid);

    if (findProduct.length == 0) {
        return res.status(404).json({ message: "Product not found"});
    }

    res.status(200).json(findProduct);
});

app.post("/products", authMiddleware, (req, res) => {
    const { role } = req.user;

    if (role != "admin") {
        return res.status(401).json({ message: "Access denied"});
    }

    const products = readData("./data/products.json");
    const { name, price } = req.body;
    const newProduct = { id: products.length + 1, name: name, price: price };
    products.push(newProduct);
    writeData("./data/products.json", products);
    res.status(200).json(newProduct);
});

app.put("/products/:id", authMiddleware, (req, res) => {
    const { role } = req.user;

    if (role != "admin") {
        return res.status(401).json({ message: "Access denied"});
    }

    const pid = parseInt(req.params.id, 10);

    const products = readData("./data/products.json");

    const findProduct = products.filter((p) => p.id === pid);

    if (findProduct.length == 0) {
        return res.status(404).json({ message: "Product not found"});
    }

    findProduct[0].name = req.body.name ? req.body.name : findProduct[0].name;
    findProduct[0].price = req.body.price ? req.body.price : findProduct[0].price;

    const newProduct = { id: findProduct[0].id, name: findProduct[0].name, price: findProduct[0].price };

    const cleanProducts = products.filter((p) => p.id !== pid);
    cleanProducts.push(newProduct);
    writeData("./data/products.json", cleanProducts);
    res.status(200).json(newProduct);
});

app.delete("/products/:id", authMiddleware, (req, res) => {
    const { role } = req.user;

    if (role != "admin") {
        return res.status(401).json({ message: "Access denied"});
    }

    const pid = parseInt(req.params.id, 10);

    const products = readData("./data/products.json");
    const filterProducts = products.filter((p) => p.id !== pid);

    if (filterProducts.length == products.length) {
        return res.status(404).json({ message: "Product not found"});
    }

    writeData("./data/products.json", filterProducts);
    res.json({ message: "Product deleted" });
});

app.listen(PORT, () => {
    console.log("Server started");
});

