
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

const app = express();
const PORT = 3000;

app.use(express.json());

let db;

async function startServer() {
  try {
    db = await open({
      filename: "./books.db",
      driver: sqlite3.Database,
    });

    console.log("Database connected successfully!");

    // Home route
    app.get("/", (req, res) => {
      res.send("Lab 2 SQLite CRUD API is running!");
    });

    // GET: Retrieve all books
    app.get("/books/", async (req, res) => {
      try {
        const books = await db.all("SELECT * FROM book");
        res.status(200).json(books);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // GET: Retrieve a book by ID
    app.get("/books/:bookId", async (req, res) => {
      try {
        const book = await db.get(
          "SELECT * FROM book WHERE id = ?",
          req.params.bookId
        );

        if (!book) {
          return res.status(404).json({ error: "Book not found" });
        }

        res.status(200).json(book);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST: Add a new book
    app.post("/books/", async (req, res) => {
      try {
        const { title, author, price, pages } = req.body;

        if (!title || !author || price == null || pages == null) {
          return res.status(400).json({
            error: "Title, author, price and pages are required",
          });
        }

        const result = await db.run(
          "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
          [title, author, price, pages]
        );

        const book = await db.get(
          "SELECT * FROM book WHERE id = ?",
          result.lastID
        );

        res.status(201).json(book);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // PUT: Update a book
    app.put("/books/:bookId", async (req, res) => {
      try {
        const { title, author, price, pages } = req.body;
        const { bookId } = req.params;

        const existingBook = await db.get(
          "SELECT * FROM book WHERE id = ?",
          bookId
        );

        if (!existingBook) {
          return res.status(404).json({ error: "Book not found" });
        }

        await db.run(
          `UPDATE book
           SET title = ?, author = ?, price = ?, pages = ?
           WHERE id = ?`,
          [
            title ?? existingBook.title,
            author ?? existingBook.author,
            price ?? existingBook.price,
            pages ?? existingBook.pages,
            bookId,
          ]
        );

        const updatedBook = await db.get(
          "SELECT * FROM book WHERE id = ?",
          bookId
        );

        res.status(200).json(updatedBook);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // DELETE: Remove a book
    app.delete("/books/:bookId", async (req, res) => {
      try {
        const { bookId } = req.params;

        const book = await db.get(
          "SELECT * FROM book WHERE id = ?",
          bookId
        );

        if (!book) {
          return res.status(404).json({ error: "Book not found" });
        }

        await db.run("DELETE FROM book WHERE id = ?", bookId);

        res.status(200).json({
          message: "Book deleted successfully",
          book,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
  }
}

startServer();
