require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authenticateToken, generateToken } = require("./tokenAuth");
const { supabase } = require("./db");
const { uploadImage } = require("./utils/storage");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

app.use(cors());
app.use(express.json());

// Public route - get all bucket lists (will be limited to user's lists after auth)
app.get("/bucket-lists", authenticateToken, async (req, res) => {
  try {
    // Get the user ID from the authenticated token
    const userId = req.user.userId;

    // Fetch bucket lists for the user
    const { data: bucketLists, error: bucketListsError } = await supabase
      .from("bucket_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bucketListsError) throw bucketListsError;

    console.log("Raw bucket lists from database:", bucketLists);

    // For each bucket list, fetch its items
    const bucketListsWithItems = await Promise.all(
      bucketLists.map(async (list) => {
        const { data: items, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("bucket_list_id", list.id);

        if (itemsError) throw itemsError;

        const bucketListWithItems = {
          bucket_list_id: list.id,
          user_id: list.user_id,
          bucket_list_title: list.title,
          bucket_list_description: list.description,
          bucket_list_created_at: list.created_at,
          cover_image: list.cover_image,
          items: items || [],
        };

        console.log("Processed bucket list:", bucketListWithItems);
        return bucketListWithItems;
      })
    );

    res.json(bucketListsWithItems);
  } catch (error) {
    console.error("Error fetching bucket lists:", error);
    res.status(500).json({ error: "Failed to fetch bucket lists" });
  }
});

// Create bucket list - protected route
app.post(
  "/bucket-lists",
  authenticateToken,
  upload.single("cover_image"),
  async (req, res) => {
    const { user_id, title, description } = req.body;
    const cover_image = req.file;

    // Validate the request body
    if (!title || !user_id || !cover_image) {
      return res
        .status(400)
        .json({ error: "Title, user_id, and cover_image are required" });
    }

    // Ensure user can only create bucket lists for themselves
    if (String(req.user.userId) !== String(user_id)) {
      console.log("User ID mismatch:", {
        tokenUserId: req.user.userId,
        requestUserId: user_id,
        tokenUserIdType: typeof req.user.userId,
        requestUserIdType: typeof user_id,
      });
      return res.status(403).json({
        error: "Unauthorized: Cannot create bucket list for another user",
      });
    }

    try {
      // Upload the cover image to Supabase Storage
      const coverImageUrl = await uploadImage(cover_image);

      const { data, error } = await supabase
        .from("bucket_lists")
        .insert([
          {
            user_id,
            title,
            description: description || null,
            cover_image: coverImageUrl,
          },
        ])
        .select();

      if (error) throw error;

      res.status(201).json(data[0]);
    } catch (error) {
      console.error("Error creating bucket list:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create bucket list" });
    }
  }
);

// Update bucket list - protected route
app.put("/bucket-lists/:id", authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    // First check if bucket list belongs to the authenticated user
    const { data: bucketList, error: bucketListError } = await supabase
      .from("bucket_lists")
      .select("*")
      .eq("id", id)
      .single();

    if (bucketListError) throw bucketListError;

    if (!bucketList) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketList.user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot update another user's bucket list",
      });
    }

    const { data, error } = await supabase
      .from("bucket_lists")
      .update({ title, description })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
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
    const { data: bucketList, error: bucketListError } = await supabase
      .from("bucket_lists")
      .select("*")
      .eq("id", id)
      .single();

    if (bucketListError) throw bucketListError;

    if (!bucketList) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketList.user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot delete another user's bucket list",
      });
    }

    // Delete the items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from("items")
      .delete()
      .eq("bucket_list_id", id);

    if (itemsError) throw itemsError;

    // Then delete the bucket list
    const { error: deleteError } = await supabase
      .from("bucket_lists")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

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

    console.log("Attempting to create user with email:", email);

    // Insert user into the database with hashed password
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword }])
      .select("id, name, email");

    if (error) {
      console.error("Supabase error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);

      if (error.code === "23505") {
        return res.status(409).json({ error: "Email already in use" });
      }
      throw error;
    }

    console.log("User created successfully:", data[0]);
    res.status(201).json(data[0]); // Send back user info (exclude password)
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ error: "Failed to create user", details: error.message });
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
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data); // Return user data (excluding password)
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
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, name, email");

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data[0]);
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
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) throw error;

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
    const { data: bucketList, error: bucketListError } = await supabase
      .from("bucket_lists")
      .select("*")
      .eq("id", bucket_list_id)
      .single();

    if (bucketListError) throw bucketListError;

    if (!bucketList) {
      return res.status(404).json({ error: "Bucket list not found" });
    }

    // Verify ownership
    if (bucketList.user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Unauthorized: Cannot add items to another user's bucket list",
      });
    }

    // Insert new item
    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          bucket_list_id,
          title,
          description: description || null,
          image_url: image_url || null,
          link_url: link_url || null,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
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
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*, bucket_lists!inner(*)")
      .eq("id", id)
      .single();

    if (itemError) throw itemError;

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Verify ownership through the bucket list
    if (item.bucket_lists.user_id !== req.user.userId) {
      return res.status(403).json({
        error:
          "Unauthorized: Cannot update items in another user's bucket list",
      });
    }

    // Use existing values if no new values are provided
    const updateData = {
      title: title ?? item.title,
      description: description ?? item.description,
      image_url: image_url ?? item.image_url,
      link_url: link_url ?? item.link_url,
    };

    const { data, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
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
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*, bucket_lists!inner(*)")
      .eq("id", id)
      .single();

    if (itemError) throw itemError;

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Verify ownership through the bucket list
    if (item.bucket_lists.user_id !== req.user.userId) {
      return res.status(403).json({
        error:
          "Unauthorized: Cannot delete items from another user's bucket list",
      });
    }

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) throw error;

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

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Check if the user exists in the database
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (userError) throw userError;

    // If no user is found, return an error
    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0]; // Get the user object

    // Step 2: Compare the password from the request with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);

    // If the password doesn't match, return an error
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token using the new function
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Refresh token endpoint
app.post("/refresh-token", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the token, but ignore expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: true,
    });

    // Generate a new token
    const newToken = generateToken(decoded.userId);

    res.json({ token: newToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    return res.status(403).json({ error: "Invalid token" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
