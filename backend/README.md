# Bucket List App Backend

This is the backend for the Bucket List application, which now uses Supabase as a cloud database.

## Setup Instructions

### 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account.
2. Create a new project and note down the project URL and API key.

### 2. Set Up the Database Schema

1. In your Supabase project, go to the SQL Editor.
2. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor.
3. This will create the necessary tables and set up Row Level Security (RLS) policies.

### 3. Configure Environment Variables

1. Update the `.env` file with your Supabase credentials:

```
PORT=3001
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
node server.js
```

## API Endpoints

### Authentication

- `POST /users` - Create a new user
- `POST /login` - Login and get a JWT token

### Bucket Lists

- `GET /bucket-lists` - Get all bucket lists for the authenticated user
- `POST /bucket-lists` - Create a new bucket list
- `PUT /bucket-lists/:id` - Update a bucket list
- `DELETE /bucket-lists/:id` - Delete a bucket list

### Items

- `POST /items` - Create a new item in a bucket list
- `PUT /items/:id` - Update an item
- `DELETE /items/:id` - Delete an item

### Users

- `GET /users/:id` - Get user information
- `PUT /users/:id` - Update user information
- `DELETE /users/:id` - Delete a user account

## Database Schema

### Users Table

- `id` - Primary key
- `name` - User's name
- `email` - User's email (unique)
- `password` - Hashed password
- `created_at` - Timestamp when the user was created

### Bucket Lists Table

- `id` - Primary key
- `user_id` - Foreign key to users table
- `title` - Bucket list title
- `description` - Bucket list description
- `created_at` - Timestamp when the bucket list was created

### Items Table

- `id` - Primary key
- `bucket_list_id` - Foreign key to bucket_lists table
- `title` - Item title
- `description` - Item description
- `image_url` - URL to an image
- `link_url` - URL to a related website
- `created_at` - Timestamp when the item was created

## Security

The application uses JWT for authentication and Supabase's Row Level Security (RLS) to ensure that users can only access their own data.
