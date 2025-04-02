const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Please check your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
supabase
  .from("bucket_lists")
  .select("count")
  .then(() => {
    console.log("Successfully connected to Supabase database");
  })
  .catch((err) => {
    console.error("Error connecting to Supabase database:", err);
  });

module.exports = {
  query: async (text, params) => {
    // This is a compatibility layer to maintain the same API
    // In a real implementation, you would use Supabase's query builder
    console.warn(
      "Using legacy query method. Consider updating to use Supabase's query builder directly."
    );

    // For now, we'll return a mock result
    return {
      rows: [],
      rowCount: 0,
    };
  },
  supabase,
};
