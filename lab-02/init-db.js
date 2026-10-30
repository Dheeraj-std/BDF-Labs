
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

async function initializeDatabase() {
  const db = await open({
    filename: "./books.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `);

  const count = await db.get("SELECT COUNT(*) AS count FROM book");

  if (count.count === 0) {
    const books = [
      ["The Alchemist", "Paulo Coelho", 250, 208],
      ["Atomic Habits", "James Clear", 450, 320],
      ["Wings of Fire", "A. P. J. Abdul Kalam", 300, 180],
      ["Rich Dad Poor Dad", "Robert Kiyosaki", 350, 336],
      ["The Hobbit", "J. R. R. Tolkien", 400, 310],
      ["Ikigai", "Hector Garcia", 280, 194],
      ["Deep Work", "Cal Newport", 420, 304],
      ["Think and Grow Rich", "Napoleon Hill", 320, 238],
      ["The Psychology of Money", "Morgan Housel", 380, 256],
      ["Clean Code", "Robert C. Martin", 550, 464],
    ];

    const statement = await db.prepare(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)"
    );

    try {
      for (const book of books) {
        await statement.run(book);
      }
    } finally {
      await statement.finalize();
    }
  }

  const result = await db.get("SELECT COUNT(*) AS count FROM book");
  console.log("Database initialized successfully!");
  console.log("Total books:", result.count);

  await db.close();
}

initializeDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
