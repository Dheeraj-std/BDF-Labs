
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Database connection
const db = new sqlite3.Database(
    path.join(__dirname, "books.db"),
    (err) => {
        if (err) console.log(err.message);
        else console.log("Database connected successfully!");
    }
);

// Home route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Books REST API" });
});

// GET all books with search, sorting, pagination and price filter
app.get("/books", (req, res) => {
    let {
        search_q = "",
        order_by = "id",
        order = "ASC",
        limit = 10,
        offset = 0,
        min_price,
        max_price
    } = req.query;

    const columns = ["id", "title", "author", "price", "pages"];
    order = order.toUpperCase();

    if (!columns.includes(order_by) || !["ASC", "DESC"].includes(order)) {
        return res.status(400).json({ message: "Invalid sorting parameters" });
    }

    if (!/^\d+$/.test(String(limit)) || Number(limit) < 1 ||
        !/^\d+$/.test(String(offset))) {
        return res.status(400).json({ message: "Invalid limit or offset" });
    }

    const conditions = [];
    const params = [];

    if (search_q) {
        conditions.push("title LIKE ?");
        params.push(`%${search_q}%`);
    }

    if (min_price !== undefined) {
        if (min_price === "" || !Number.isFinite(Number(min_price)) || Number(min_price) < 0) {
            return res.status(400).json({ message: "Invalid min_price" });
        }
        conditions.push("price >= ?");
        params.push(Number(min_price));
    }

    if (max_price !== undefined) {
        if (max_price === "" || !Number.isFinite(Number(max_price)) || Number(max_price) < 0) {
            return res.status(400).json({ message: "Invalid max_price" });
        }
        conditions.push("price <= ?");
        params.push(Number(max_price));
    }

    if (min_price !== undefined && max_price !== undefined &&
        Number(min_price) > Number(max_price)) {
        return res.status(400).json({ message: "min_price cannot exceed max_price" });
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
        SELECT * FROM book
        ${where}
        ORDER BY ${order_by} ${order}
        LIMIT ? OFFSET ?
    `;

    db.all(sql, [...params, Number(limit), Number(offset)], (err, books) => {
        if (err) return res.status(500).json({ message: err.message });

        res.status(200).json({
            message: "Books retrieved successfully",
            count: books.length,
            books
        });
    });
});

// GET book by ID
app.get("/books/:id", (req, res) => {
    db.get("SELECT * FROM book WHERE id = ?", [req.params.id], (err, book) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!book) return res.status(404).json({ message: "Book not found" });

        res.status(200).json(book);
    });
});

// POST - Add a new book
app.post("/books", (req, res) => {
    const { title, author, price, pages = 1 } = req.body;

    if (
        typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        price === undefined || price === null || price === "" ||
        !Number.isFinite(Number(price)) || Number(price) < 0
    ) {
        return res.status(400).json({
            message: "Title, author and a valid non-negative price are required"
        });
    }

    db.run(
        "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
        [title.trim(), author.trim(), Number(price), Number(pages)],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });

            res.status(201).json({
                message: "Book created successfully",
                id: this.lastID
            });
        }
    );
});

// PUT - Update a book
app.put("/books/:id", (req, res) => {
    const { title, author, price, pages } = req.body;

    db.get("SELECT * FROM book WHERE id = ?", [req.params.id], (err, book) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!book) return res.status(404).json({ message: "Book not found" });

        const updated = {
            title: title === undefined ? book.title : title,
            author: author === undefined ? book.author : author,
            price: price === undefined ? book.price : Number(price),
            pages: pages === undefined ? book.pages : Number(pages)
        };

        if (
            typeof updated.title !== "string" || !updated.title.trim() ||
            typeof updated.author !== "string" || !updated.author.trim() ||
            !Number.isFinite(updated.price) || updated.price < 0 ||
            !Number.isInteger(updated.pages) || updated.pages < 1
        ) {
            return res.status(400).json({ message: "Invalid book details" });
        }

        db.run(
            "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
            [updated.title.trim(), updated.author.trim(), updated.price, updated.pages, req.params.id],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ message: updateErr.message });

                res.status(200).json({ message: "Book updated successfully" });
            }
        );
    });
});

// DELETE - Delete a book
app.delete("/books/:id", (req, res) => {
    db.run("DELETE FROM book WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: err.message });

        if (this.changes === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json({ message: "Book deleted successfully" });
    });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400) {
        return res.status(400).json({ message: "Invalid JSON format" });
    }
    next(err);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
