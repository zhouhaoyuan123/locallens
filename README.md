
# GeoArticles - Location-Based Article Platform

A location-based article recommendation system that allows users to find articles near them, manage their own content, and discover content based on tags and popularity.

## Features

- **User Authentication**
  - Sign up and login with username, email, and password
  - Profile management with location settings

- **Article Management**
  - Create, edit, and delete your own articles
  - Add images, text content, tags, and location data
  - Like/unlike articles from other users

- **Location Features**
  - Automatically get your current location
  - Manually set your location
  - Set specific locations for articles
  - Sort articles by distance from your location

- **Browsing & Discovery**
  - Filter articles by tags
  - Sort by newest, most liked, or distance
  - View article details and engagement metrics

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Authentication**: Session-based with bcrypt password hashing
- **File Uploads**: Multer for image uploading

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   node index.js
   ```
4. Visit [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Authentication
- `POST /api/register` - Create a new user account
- `POST /api/login` - Login to existing account
- `POST /api/logout` - Logout current user
- `GET /api/user` - Get current user details
- `PUT /api/user/location` - Update user location

### Articles
- `GET /api/articles` - Get all articles (with filtering options)
- `GET /api/articles/:id` - Get a specific article
- `POST /api/articles` - Create a new article
- `PUT /api/articles/:id` - Update an existing article
- `DELETE /api/articles/:id` - Delete an article
- `POST /api/articles/:id/like` - Toggle like on an article

### Tags
- `GET /api/tags` - Get all tags

## Query Parameters for Articles

- `sort`: Sort by 'newest', 'likes', or 'distance'
- `tags`: Filter by comma-separated tag names
- `latitude` & `longitude`: Used with 'distance' sorting
- `userId`: Filter articles by a specific user

## License

MIT
