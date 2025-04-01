require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

  // Hash the password
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert user into the database with hashed password
    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]); // Send back user info (exclude password)
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already in use" }); // Unique constraint violation (email already exists)
    }

    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/users/:id", async (req, res) => {
  const userId = req.params.id; // Get user ID from URL

  try {
    const result = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]); // Return user data (excluding password)
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;

  if (!name && !email) {
    return res
      .status(400)
      .json({ error: "At least one field (name or email) must be provided" });
  }

  try {
    let query = "UPDATE users SET ";
    const values = [];
    let index = 1;

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (email) {
      query += `email = $${index}, `;
      values.push(email);
      index++;
    }

    query = query.slice(0, -2); // Remove trailing comma
    query += ` WHERE id = $${index} RETURNING id, name, email`;
    values.push(userId);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/users/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  // Ensure the user is deleting their own account
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized to delete this account" });
  }

  try {
    // Delete user (this will fail if there are related bucket lists unless cascading is enabled)
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
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

app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, link_url } = req.body;

  try {
    const existingItem = await db.query("SELECT * FROM items WHERE id = $1", [
      id,
    ]);
    if (existingItem.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Use existing values if no new values are provided
    const updatedTitle = title ?? existingItem.rows[0].title;
    const updatedDescription = description ?? existingItem.rows[0].description;
    const updatedImageUrl = image_url ?? existingItem.rows[0].image_url;
    const updatedLinkUrl = link_url ?? existingItem.rows[0].link_url;

    const result = await db.query(
      "UPDATE items SET title = $1, description = $2, image_url = $3, link_url = $4 WHERE id = $5 RETURNING *",
      [updatedTitle, updatedDescription, updatedImageUrl, updatedLinkUrl, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation: Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Step 1: Check if the user exists in the database
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // If no user is found, return an error
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0]; // Get the user object

    // Step 2: Compare the password from the request with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);

    // If the password doesn't match, return an error
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Step 3: Generate a JWT token for the user
    const token = jwt.sign(
      { userId: user.id }, // Payload (we store the user id in the token)
      process.env.JWT_SECRET, // Secret key (use environment variable to keep it secure)
      { expiresIn: "1h" } // Token expiration time (optional, here it's 1 hour)
    );

    // Step 4: Send the token in the response
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
});
