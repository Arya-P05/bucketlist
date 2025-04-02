require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./tokenAuth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = require("./db");

// Public route - get all bucket lists (will be limited to user's lists after auth)
app.get("/bucket-lists", authenticateToken, async (req, res) => {
  try {
    // Get the user ID from the authenticated token
    const userId = req.user.userId;

    const result = await db.query(
      `
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
        WHERE b.user_id = $1
        GROUP BY b.id
        ORDER BY b.created_at DESC;
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bucket lists:", error);
    res.status(500).json({ error: "Failed to fetch bucket lists" });
  }
});

// Create bucket list - protected route
app.post("/bucket-lists", authenticateToken, async (req, res) => {
  const { user_id, title, description } = req.body;

  // Validate the request body
  if (!title || !user_id) {
    return res.status(400).json({ error: "Title and user_id are required" });
  }

  // Ensure user can only create bucket lists for themselves
  if (req.user.userId !== user_id) {
    return res.status(403).json({
      error: "Unauthorized: Cannot create bucket list for another user",
    });
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

// Update bucket list - protected route
app.put("/bucket-lists/:id", authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    // First check if bucket list belongs to the authenticated user
    const bucketListCheck = await db.query(
      "SELECT * FROM bucket_lists WHERE id = $1",
      [id]
    );

    if (bucketListCheck.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketListCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot update another user's bucket list",
      });
    }

    const result = await db.query(
      "UPDATE bucket_lists SET title = $1, description = $2 WHERE id = $3 RETURNING *",
      [title, description, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating bucket list:", error);
    res.status(500).json({ error: "Failed to update bucket list" });
  }
});

// Delete bucket list - protected route
app.delete("/bucket-lists/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // First check if bucket list belongs to the authenticated user
    const bucketListCheck = await db.query(
      "SELECT * FROM bucket_lists WHERE id = $1",
      [id]
    );

    if (bucketListCheck.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketListCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot delete another user's bucket list",
      });
    }

    // Delete the items first (due to foreign key constraint)
    await db.query("DELETE FROM items WHERE bucket_list_id = $1", [id]);

    // Then delete the bucket list
    const result = await db.query(
      "DELETE FROM bucket_lists WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ message: "Bucket list deleted" });
  } catch (error) {
    console.error("Error deleting bucket list:", error);
    res.status(500).json({ error: "Failed to delete bucket list" });
  }
});

// Create user - public route
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

// Get user by ID - protected route
app.get("/users/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id; // Get user ID from URL

  // Ensure users can only access their own information
  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({
      error: "Unauthorized: Cannot access another user's information",
    });
  }

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

// Update user - protected route
app.put("/users/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;

  // Ensure users can only update their own information
  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({
      error: "Unauthorized: Cannot update another user's information",
    });
  }

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

// Delete user - protected route
app.delete("/users/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  // Ensure the user is deleting their own account
  if (req.user.userId !== userId) {
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

// Create bucket list item - protected route
app.post("/items", authenticateToken, async (req, res) => {
  const { bucket_list_id, title, description, image_url, link_url } = req.body;

  // Validate required fields
  if (!bucket_list_id || !title) {
    return res
      .status(400)
      .json({ error: "Bucket list ID and title are required" });
  }

  try {
    // Check if bucket_list_id exists and belongs to the current user
    const bucketListCheck = await db.query(
      "SELECT * FROM bucket_lists WHERE id = $1",
      [bucket_list_id]
    );

    if (bucketListCheck.rows.length === 0) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketListCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot add items to another user's bucket list",
      });
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

// Update bucket list item - protected route
app.put("/items/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, link_url } = req.body;

  try {
    // First fetch the item to check bucket list ownership
    const itemCheck = await db.query(
      `
      SELECT i.*, b.user_id 
      FROM items i
      JOIN bucket_lists b ON i.bucket_list_id = b.id
      WHERE i.id = $1
    `,
      [id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Verify ownership through the bucket list
    if (itemCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        error:
          "Unauthorized: Cannot update items in another user's bucket list",
      });
    }

    const existingItem = itemCheck.rows[0];

    // Use existing values if no new values are provided
    const updatedTitle = title ?? existingItem.title;
    const updatedDescription = description ?? existingItem.description;
    const updatedImageUrl = image_url ?? existingItem.image_url;
    const updatedLinkUrl = link_url ?? existingItem.link_url;

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

// Delete bucket list item - protected route
app.delete("/items/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // First fetch the item to check bucket list ownership
    const itemCheck = await db.query(
      `
      SELECT i.*, b.user_id 
      FROM items i
      JOIN bucket_lists b ON i.bucket_list_id = b.id
      WHERE i.id = $1
    `,
      [id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Verify ownership through the bucket list
    if (itemCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        error:
          "Unauthorized: Cannot delete items from another user's bucket list",
      });
    }

    const result = await db.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Public route to check if backend is running
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});

// Login route - public
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
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
