
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Set up file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

// Create database tables
function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Articles table
    db.run(`CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      user_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Tags table
    db.run(`CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

    // Article_Tags junction table
    db.run(`CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    )`);

    // Likes table
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, article_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
    )`);
  });
}

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into database
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        // Set session
        req.session.userId = this.lastID;
        res.status(201).json({ 
          id: this.lastID, 
          username, 
          email
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = user.id;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      latitude: user.latitude,
      longitude: user.longitude
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/user', isAuthenticated, (req, res) => {
  db.get('SELECT id, username, email, latitude, longitude FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update user location
app.put('/api/user/location', isAuthenticated, (req, res) => {
  const { latitude, longitude } = req.body;
  
  db.run(
    'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
    [latitude, longitude, req.session.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ latitude, longitude });
    }
  );
});

// Articles routes
app.post('/api/articles', isAuthenticated, upload.single('image'), (req, res) => {
  const { title, content, latitude, longitude, tags } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.serialize(() => {
    db.run(
      'INSERT INTO articles (title, content, image_url, user_id, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, image_url, req.session.userId, latitude, longitude],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const articleId = this.lastID;
        
        // Handle tags if provided
        if (tags && tags.length > 0) {
          const tagList = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
          
          const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
          const linkArticleTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');
          
          tagList.forEach(tagName => {
            insertTag.run(tagName, function() {
              // Get the tag id (either newly inserted or existing)
              db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, tag) => {
                if (tag) {
                  linkArticleTag.run(articleId, tag.id);
                }
              });
            });
          });
          
          insertTag.finalize();
          linkArticleTag.finalize();
        }
        
        res.status(201).json({ 
          id: articleId,
          title,
          content,
          image_url,
          user_id: req.session.userId,
          latitude,
          longitude,
          tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
        });
      }
    );
  });
});

app.get('/api/articles', (req, res) => {
  const { sort, tags, latitude, longitude, userId } = req.query;
  
  let query = `
    SELECT a.*, u.username as author, COUNT(l.user_id) as like_count,
    GROUP_CONCAT(t.name) as tags
    FROM articles a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN likes l ON a.id = l.article_id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
  `;
  
  let whereConditions = [];
  let params = [];
  
  // Filter by tags
  if (tags) {
    const tagArray = tags.split(',');
    whereConditions.push(`a.id IN (
      SELECT article_id FROM article_tags
      JOIN tags ON article_tags.tag_id = tags.id
      WHERE tags.name IN (${tagArray.map(() => '?').join(',')})
      GROUP BY article_id
      HAVING COUNT(DISTINCT tags.name) = ?
    )`);
    params = [...params, ...tagArray, tagArray.length];
  }
  
  // Filter by user
  if (userId) {
    whereConditions.push('a.user_id = ?');
    params.push(userId);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ' GROUP BY a.id';
  
  // Apply sorting
  if (sort === 'likes') {
    query += ' ORDER BY like_count DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY a.created_at DESC';
  } else if (sort === 'distance' && latitude && longitude) {
    // Calculate distance using Haversine formula
    query += `
      ORDER BY (
        6371 * acos(
          cos(radians(?)) * 
          cos(radians(a.latitude)) * 
          cos(radians(a.longitude) - radians(?)) + 
          sin(radians(?)) * 
          sin(radians(a.latitude))
        )
      )
    `;
    params.push(latitude, longitude, latitude);
  } else {
    query += ' ORDER BY a.created_at DESC';
  }
  
  db.all(query, params, (err, articles) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Process the results to format tags as arrays
    const formattedArticles = articles.map(article => ({
      ...article,
      tags: article.tags ? article.tags.split(',') : []
    }));
    
    res.json(formattedArticles);
  });
});

app.get('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT a.*, u.username as author, COUNT(l.user_id) as like_count,
    GROUP_CONCAT(t.name) as tags
    FROM articles a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN likes l ON a.id = l.article_id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    WHERE a.id = ?
    GROUP BY a.id
  `, [id], (err, article) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Format tags as an array
    article.tags = article.tags ? article.tags.split(',') : [];
    
    res.json(article);
  });
});

app.put('/api/articles/:id', isAuthenticated, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content, latitude, longitude, tags } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  // Check if the user owns this article
  db.get('SELECT * FROM articles WHERE id = ? AND user_id = ?', 
    [id, req.session.userId], 
    (err, article) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!article) {
        return res.status(403).json({ error: 'Unauthorized to edit this article' });
      }
      
      // Build the update query
      let updateFields = [];
      let updateParams = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }
      
      if (content !== undefined) {
        updateFields.push('content = ?');
        updateParams.push(content);
      }
      
      if (image_url !== undefined) {
        updateFields.push('image_url = ?');
        updateParams.push(image_url);
      }
      
      if (latitude !== undefined) {
        updateFields.push('latitude = ?');
        updateParams.push(latitude);
      }
      
      if (longitude !== undefined) {
        updateFields.push('longitude = ?');
        updateParams.push(longitude);
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(id);
      
      db.serialize(() => {
        db.run(
          `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams,
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Update tags if provided
            if (tags !== undefined) {
              // Remove existing tags
              db.run('DELETE FROM article_tags WHERE article_id = ?', [id]);
              
              // Add new tags
              const tagList = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
              
              const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
              const linkArticleTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');
              
              tagList.forEach(tagName => {
                insertTag.run(tagName, function() {
                  // Get the tag id (either newly inserted or existing)
                  db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, tag) => {
                    if (tag) {
                      linkArticleTag.run(id, tag.id);
                    }
                  });
                });
              });
              
              insertTag.finalize();
              linkArticleTag.finalize();
            }
            
            res.json({ 
              id: parseInt(id),
              message: 'Article updated successfully'
            });
          }
        );
      });
    }
  );
});

app.delete('/api/articles/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  // Check if the user owns this article
  db.get('SELECT * FROM articles WHERE id = ? AND user_id = ?', 
    [id, req.session.userId], 
    (err, article) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!article) {
        return res.status(403).json({ error: 'Unauthorized to delete this article' });
      }
      
      // Delete the article
      db.run('DELETE FROM articles WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: 'Article deleted successfully' });
      });
    }
  );
});

// Likes routes
app.post('/api/articles/:id/like', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    // Check if article exists
    db.get('SELECT * FROM articles WHERE id = ?', [id], (err, article) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      // Check if already liked
      db.get('SELECT * FROM likes WHERE user_id = ? AND article_id = ?', 
        [req.session.userId, id], 
        (err, like) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (like) {
            // Unlike if already liked
            db.run('DELETE FROM likes WHERE user_id = ? AND article_id = ?', 
              [req.session.userId, id], 
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                res.json({ liked: false });
              }
            );
          } else {
            // Like if not already liked
            db.run('INSERT INTO likes (user_id, article_id) VALUES (?, ?)', 
              [req.session.userId, id], 
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                res.json({ liked: true });
              }
            );
          }
        }
      );
    });
  });
});

// Tags routes
app.get('/api/tags', (req, res) => {
  db.all('SELECT * FROM tags ORDER BY name', (err, tags) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(tags);
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
