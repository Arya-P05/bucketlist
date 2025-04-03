const { supabase } = require("../db");

async function uploadImage(file) {
  try {
    if (!file || !file.buffer) {
      throw new Error("No file or file buffer provided");
    }

    // Generate a unique filename
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    // Upload the file buffer to Supabase Storage
    const { data, error } = await supabase.storage
      .from("bucket-list-covers")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("bucket-list-covers").getPublicUrl(fileName);

    // Clean up the URL by removing any double slashes
    const cleanUrl = publicUrl.replace(/([^:]\/)\/+/g, "$1");
    console.log("Generated image URL:", cleanUrl); // Debug log

    return cleanUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

module.exports = {
  uploadImage,
};
