# Database Configuration Guide

This application supports both MongoDB and PostgreSQL databases. You can easily switch between them using environment variables.

## Quick Setup

### 1. Choose Your Database
Set the `DB_TYPE` environment variable in your `.env-dev` file:

```bash
# For PostgreSQL (Neon)
DB_TYPE=postgres

# For MongoDB
DB_TYPE=mongodb
```

### 2. Database Connection Options

#### PostgreSQL (Neon) - Recommended
The Neon PostgreSQL connection is already configured:
```bash
NEON_POSTGRES_URL=postgresql://neondb_owner:npg_Et9BkvL5ypDb@ep-proud-mouse-adxpee1a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### MongoDB (Existing)
```bash
MONGODB_URI=mongodb+srv://astroforspam:P8hAPE4dw4yU1PvW@cluster0.ozfowsi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=Cluster0
```

#### Local PostgreSQL (Alternative)
If you want to use a local PostgreSQL instance:
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_DB_NAME=foodie
```

## How It Works

The application automatically:
1. Reads the `DB_TYPE` from environment variables
2. Loads the appropriate database connection based on the type
3. Uses the corresponding service layer (MongoDB or SQL services)

## File Structure

- `src/config/config.ts` - Main configuration file
- `src/db/index.ts` - Database selector based on DB_TYPE
- `src/db/db.ts` - MongoDB connection
- `src/db/sequelize.ts` & `src/db/sql/sequelize.ts` - PostgreSQL connections
- `src/services/index.ts` - Service layer selector

## Switching Databases

To switch from MongoDB to PostgreSQL:
1. Change `DB_TYPE=postgres` in `.env-dev`
2. Restart the server
3. The app will automatically use PostgreSQL and SQL-based services

To switch back to MongoDB:
1. Change `DB_TYPE=mongodb` in `.env-dev`
2. Restart the server
3. The app will use MongoDB and Mongoose-based services

## SSL Configuration

The Neon PostgreSQL connection includes SSL configuration automatically when `sslmode=require` is detected in the connection string.
