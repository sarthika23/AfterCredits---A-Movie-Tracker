const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

//Fixed CORS configuration (removed extra space and trailing slash)
app.use(cors({
  origin: "http://localhost:5173",  // Fixed: removed space and trailing slash
  methods: ["GET", "POST", "DELETE", "PUT"],  // Added PUT for future use
  credentials: true
}));

app.use(express.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",           // change if your MySQL user is different
  password: "sarthika@230305",           // put your MySQL password here
  database: "binged",     // name of the database you created
  port: 3305,
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Add or update movie
app.post("/movies", (req, res) => {
  const m = req.body;
  console.log("Received movie data:", m); // Log incoming data

  // Helper to convert to YYYY-MM-DD
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return null; // handle invalid date
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  const formattedWatchedDate = formatDate(m.watchedDate);
  const formattedDateAdded = formatDate(m.dateAdded) || new Date().toISOString().split('T')[0];

  db.query(
    "REPLACE INTO movies SET ?",
    {
      id: m.id || Date.now(), // Ensure ID exists
      title: m.title,
      genre: m.genre,
      rating: m.rating,
      review: m.review,
      year: m.year,
      watchedDate: formattedWatchedDate,
      status: m.status || 'watched',
      dateAdded: formattedDateAdded
    },
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send(err);
      }
      console.log("Insert results:", results);
      res.send("Movie saved");
    }
  );
});


// Get all movies
app.get("/movies", (req, res) => {
  db.query("SELECT * FROM movies ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Delete movie
app.delete("/movies/:id", (req, res) => {
  const movieId = req.params.id;
  
  db.query("DELETE FROM movies WHERE id = ?", [movieId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    
    res.json({ message: "Movie deleted successfully" });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});