require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = require("./db");

app.get("/bucket-lists", async (req, res) => {
  try {
    const result = await db.query(`
        SELECT 
          b.id AS bucket_list_id, 
          b.user_id, 
          b.title AS bucket_list_title, 
          b.description AS bucket_list_description, 
          b.created_at AS bucket_list_created_at, 
          json_agg(
            json_build_object(
              'id', i.id, 
              'title', i.title, 
              'description', i.description, 
              'image_url', i.image_url, 
              'link_url', i.link_url, 
              'created_at', i.created_at
            )
          ) AS items
        FROM bucket_lists b
        LEFT JOIN items i ON b.id = i.bucket_list_id
        GROUP BY b.id
        ORDER BY b.created_at DESC;
      `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bucket lists:", error);
    res.status(500).json({ error: "Failed to fetch bucket lists" });
  }
});

app.post("/bucket-lists", async (req, res) => {
  const { user_id, title, description } = req.body;

  // Validate the request body
  if (!title || !user_id) {
    return res.status(400).json({ error: "Title and user_id are required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO bucket_lists (user_id, title, description) VALUES ($1, $2, $3) RETURNING *",
      [user_id, title, description || null] // If no description, set it to null
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating bucket list:", error);
    res.status(500).json({ error: "Failed to create bucket list" });
  }
});

app.put("/bucket-lists/:id", async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;
  try {
    const result = await db.query(
      "UPDATE bucket_lists SET title = $1, description = $2 WHERE id = $3 RETURNING *",
      [title, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating bucket list:", error);
    res.status(500).json({ error: "Failed to update bucket list" });
  }
});

app.delete("/bucket-lists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM items WHERE bucket_list_id = $1", [id]);
    const result = await db.query(
      "DELETE FROM bucket_lists WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }
    res.json({ message: "Bucket list deleted" });
  } catch (error) {
    console.error("Error deleting bucket list:", error);
    res.status(500).json({ error: "Failed to delete bucket list" });
  }
});

app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === "23505") {
      // Unique constraint violation (email already exists)
      return res.status(409).json({ error: "Email already in use" });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/items", async (req, res) => {
  const { bucket_list_id, title, description, image_url, link_url } = req.body;

  // Validate required fields
  if (!bucket_list_id || !title) {
    return res
      .status(400)
      .json({ error: "Bucket list ID and title are required" });
  }

  try {
    // Check if bucket_list_id exists
    const bucketListCheck = await db.query(
      "SELECT id FROM bucket_lists WHERE id = $1",
      [bucket_list_id]
    );

    if (bucketListCheck.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Insert new item
    const result = await db.query(
      `INSERT INTO items (bucket_list_id, title, description, image_url, link_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
      [
        bucket_list_id,
        title,
        description || null,
        image_url || null,
        link_url || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Update an item
app.put("/items/:id", async (req, res) => {
  const { title, description, image_url, link_url } = req.body;
  const { id } = req.params;
  try {
    const result = await db.query(
      "UPDATE items SET title = $1, description = $2, image_url = $3, link_url = $4 WHERE id = $5 RETURNING *",
      [title, description, image_url, link_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
