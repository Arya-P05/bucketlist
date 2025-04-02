# Bucket List App

A web application for creating, managing, and sharing bucket lists with friends.

## Features

- User authentication (signup, login)
- Create and manage bucket lists
- Add items to your bucket lists with titles, descriptions, images, and links
- Delete bucket lists and items
- Beautiful and responsive UI built with Next.js and Tailwind CSS

## Technologies Used

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT for authentication

## Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (make sure the database server is running)

### Database Setup

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

### Installation

1. Clone the repository
2. Install dependencies

```bash
# Install dependencies for the root, frontend, and backend
npm run install:all
```

3. Set up environment variables:

Create a `.env` file in the backend directory with the following details:

```
PORT=3001
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
JWT_SECRET=your_secret_key_for_jwt
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
