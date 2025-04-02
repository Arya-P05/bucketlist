# Bucket List App

A web application for creating, managing, and sharing bucket lists with friends.

## Features

- User authentication (signup, login)
- Create and manage bucket lists
- Add items to your bucket lists with titles, descriptions, images, and links
- Delete bucket lists and items
- Beautiful and responsive UI built with Next.js and Tailwind CSS
- Cloud database support with Supabase

## Technologies Used

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Supabase (PostgreSQL in the cloud)
- JWT for authentication

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Supabase account (for cloud database)

### Database Setup

You have two options for the database:

#### Option 1: Local PostgreSQL (Development)

1. Create a PostgreSQL database for the application
2. Create the following tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bucket_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  bucket_list_id INTEGER REFERENCES bucket_lists(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Option 2: Supabase (Production)

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL script in `backend/supabase-schema.sql` in the Supabase SQL Editor
4. Note down your Supabase URL and API key

### Installation

1. Clone the repository
2. Install dependencies

```bash
# Install dependencies for the root, frontend, and backend
npm run install:all
```

3. Set up environment variables:

Create a `.env` file in the backend directory with the following details:

#### For Local PostgreSQL:

```
PORT=3001
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
JWT_SECRET=your_secret_key_for_jwt
```

#### For Supabase:

```
PORT=3001
JWT_SECRET=your_secret_key_for_jwt
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
```

4. Start the application in development mode:

```bash
npm run dev
```

This will start both the frontend and backend servers:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Usage

1. Register a new account or log in with an existing account
2. Create a new bucket list from the dashboard
3. Add items to your bucket list
4. View, edit, or delete your bucket lists and items

## Deployment

### Frontend

The frontend can be deployed to Vercel, Netlify, or any other static hosting service that supports Next.js.

### Backend

The backend can be deployed to Heroku, Railway, or any other Node.js hosting service.

### Database

For production, use the Supabase cloud database option. This provides a scalable, secure, and managed PostgreSQL database.
