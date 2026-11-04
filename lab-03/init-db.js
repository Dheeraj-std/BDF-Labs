
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./books.db", (error) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    return;
  }

  console.log("Connected to SQLite database.");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL,
      pages INTEGER NOT NULL
    )
  `, (error) => {
    if (error) {
      console.error("Table creation failed:", error.message);
      db.close();
      return;
    }

    console.log("Book table is ready.");

    db.get("SELECT COUNT(*) AS count FROM book", (error, row) => {
      if (error) {
        console.error("Could not check books:", error.message);
        db.close();
        return;
      }

      if (row.count === 0) {
        const books = [
          ["The Alchemist", "Paulo Coelho", 299, 208],
          ["Atomic Habits", "James Clear", 450, 320],
          ["Wings of Fire", "A. P. J. Abdul Kalam", 250, 180],
          ["The Hobbit", "J. R. R. Tolkien", 399, 310],
          ["Clean Code", "Robert C. Martin", 650, 464],
          ["Deep Work", "Cal Newport", 350, 296],
          ["Ikigai", "Hector Garcia", 275, 208],
          ["Rich Dad Poor Dad", "Robert Kiyosaki", 320, 336],
          ["Think and Grow Rich", "Napoleon Hill", 299, 238],
          ["Introduction to Algorithms", "Thomas H. Cormen", 899, 1312]
        ];

        const statement = db.prepare(
          "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)"
        );

        for (const book of books) {
          statement.run(book);
        }

        statement.finalize((error) => {
          if (error) {
            console.error("Seeding failed:", error.message);
          } else {
            console.log("10 sample books inserted.");
          }

          db.close();
        });
      } else {
        console.log("Existing books found; seed data was not added again.");
        db.close();
      }
    });
  });
});
