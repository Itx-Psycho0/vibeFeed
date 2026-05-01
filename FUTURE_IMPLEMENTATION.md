# 🔮 VibeFeed — Future Implementation Roadmap

> This document outlines **what** needs to be built, **why** it's needed, **when** to implement it, **where** in the codebase, and **how** to approach it.

---

## 📊 Priority Matrix

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🔴 P0 | Complete Explore Page | High | Medium |
| 🔴 P0 | Complete Notifications Page | High | Medium |
| 🔴 P0 | Complete Messages/Chat Page | High | High |
| 🟡 P1 | Like/Comment Integration on Feed | High | Low |
| 🟡 P1 | Create Post UI | High | Medium |
| 🟡 P1 | Profile Edit Page | Medium | Low |
| 🟡 P1 | Follow/Unfollow Button | High | Low |
| 🟢 P2 | Image Upload Integration | Medium | Medium |
| 🟢 P2 | Stories UI | Medium | High |
| 🟢 P2 | Search Functionality | Medium | Medium |
| 🔵 P3 | Dark/Light Theme Toggle | Low | Low |
| 🔵 P3 | PWA (Progressive Web App) | Low | Medium |
| 🔵 P3 | Email Verification | Medium | Medium |
| 🔵 P3 | OAuth (Google/GitHub Login) | Medium | High |

---

## 🔴 P0 — Must Build Next

### 1. Complete Explore Page
- **WHAT**: A grid of trending/popular posts from all users (not just followed)
- **WHY**: Core feature for content discovery — how new users find content
- **WHERE**: `frontend/src/pages/Explore.jsx` + existing `GET /api/v1/posts/explore` backend
- **HOW**: 
  - Fetch from `/posts/explore` (already has Redis caching!)
  - Display in a 3-column masonry grid (like Instagram Explore)
  - Add search bar at the top (calls `/posts/search?q=keyword`)
  - Add category filters by hashtags
- **WHEN**: Immediately — the backend is already done!

### 2. Complete Notifications Page
- **WHAT**: Real-time notification list showing likes, comments, follows
- **WHY**: Users need to know when someone interacts with their content
- **WHERE**: `frontend/src/pages/Notifications.jsx` + existing backend routes
- **HOW**:
  - Fetch from `GET /api/v1/notifications`
  - Connect Socket.io for real-time updates (`new_notification` event)
  - Display notification cards with sender avatar, action text, timestamp
  - "Mark all as read" button (calls `PUT /api/v1/notifications/read-all`)
  - Unread count badge in Sidebar
- **WHEN**: After Explore page

### 3. Complete Messages/Chat Page
- **WHAT**: Real-time chat interface with conversation list and message threads
- **WHY**: Direct messaging is essential for user engagement
- **WHERE**: `frontend/src/pages/Messages.jsx` + existing backend + Socket.io
- **HOW**:
  - Left panel: Conversation list (from `GET /api/v1/messages/conversations`)
  - Right panel: Message thread (from `GET /api/v1/messages/:conversationId`)
  - Message input with send button (calls `POST /api/v1/messages/:conversationId`)
  - Socket.io for instant message delivery (`new_message` event)
  - Online status indicator (using `user_online`/`user_offline` events)
- **WHEN**: After Notifications page

---

## 🟡 P1 — High Value Features

### 4. Like/Comment Integration on Feed
- **WHAT**: Working like button and comment section on each post card
- **WHY**: Core social media interaction — currently buttons are non-functional
- **WHERE**: `frontend/src/pages/Home.jsx` (extend post card)
- **HOW**:
  - Like: Call `POST /api/v1/likes/post/:postId` on click
  - Toggle heart icon fill (red when liked, outline when not)
  - Track liked state: Check if `post.likes.includes(currentUser._id)`
  - Comments: Expandable comment section below each post
  - Comment input: Call `POST /api/v1/comments/:postId`

### 5. Create Post UI
- **WHAT**: Modal/page for creating new posts with image upload
- **WHY**: Users can't create content without this!
- **WHERE**: New `frontend/src/components/CreatePost.jsx`
- **HOW**:
  - Modal overlay with textarea (caption) and file input (image)
  - Upload image first: `POST /api/v1/upload` → get Cloudinary URL
  - Then create post: `POST /api/v1/posts` with the URL
  - Add hashtag extraction from caption (regex: `/#\w+/g`)
  - Show in feed immediately after creation (optimistic update)

### 6. Profile Edit Page
- **WHAT**: Form to update name, bio, profile picture, privacy settings
- **WHERE**: Extend `frontend/src/pages/Profile.jsx` or create `EditProfile.jsx`
- **HOW**: Call `PUT /api/v1/users/profile` with updated fields

### 7. Follow/Unfollow Button on Profile
- **WHAT**: Button on user profiles to follow/unfollow
- **WHERE**: `frontend/src/pages/Profile.jsx`
- **HOW**: Call `POST /api/v1/users/:id/follow` (toggle)

---

## 🟢 P2 — Enhancement Features

### 8. Image Upload Integration
- **WHAT**: Drag-and-drop or click-to-upload image interface
- **WHERE**: New `frontend/src/components/ImageUpload.jsx`
- **HOW**: Use FormData API to send file to `POST /api/v1/upload`

### 9. Stories UI
- **WHAT**: Story rings at top of feed, story viewer with auto-advance
- **WHERE**: New `frontend/src/components/Stories.jsx`
- **HOW**: Fetch from `GET /api/v1/stories/feed`, display avatar rings

### 10. Search Functionality
- **WHAT**: Global search for users and posts
- **WHERE**: New `frontend/src/components/SearchBar.jsx`
- **HOW**: Call `GET /api/v1/users/search?q=` and `GET /api/v1/posts/search?q=`

---

## 🔵 P3 — Advanced Features

### 11. Dark/Light Theme Toggle
- **WHAT**: Switch between dark and light color schemes
- **HOW**: Create a second set of CSS variables and toggle `:root` class

### 12. Progressive Web App (PWA)
- **WHAT**: Install the app on mobile home screen, work offline
- **HOW**: Add `manifest.json`, service worker, and offline caching

### 13. Email Verification
- **WHAT**: Verify email after registration
- **HOW**: Use Nodemailer + verification token in the database

### 14. OAuth Social Login
- **WHAT**: Login with Google/GitHub
- **HOW**: Use Passport.js strategies (passport-google-oauth20, passport-github2)

### 15. Advanced Backend Features
- **Rate Limiting**: `express-rate-limit` to prevent API abuse
- **Security Headers**: `helmet` middleware for XSS, clickjacking protection
- **Request Validation**: `Joi` or `Zod` for input validation
- **API Documentation**: `swagger-ui-express` for auto-generated API docs
- **Logging**: Winston/Pino for structured, file-based logging
- **Testing**: Jest + Supertest for backend API tests, React Testing Library for frontend

---

## 🏗️ Architecture Improvements

### Database Optimization
- Add MongoDB text indexes for search performance
- Move followers/following to a separate collection (scales better)
- Add database migration strategy for schema changes

### DevOps & Deployment
- **Docker**: Containerize with `Dockerfile` and `docker-compose.yml`
- **CI/CD**: GitHub Actions for automated testing on every push
- **Deploy Frontend**: Vercel or Netlify (free, auto-deploy from GitHub)
- **Deploy Backend**: Railway, Render, or AWS (with PM2 process manager)
- **Environment Management**: Separate `.env.development`, `.env.production`

### Performance
- **Frontend**: Code splitting with React.lazy(), image lazy loading, skeleton screens
- **Backend**: Response compression (gzip), query optimization, connection pooling
- **Caching**: Expand Redis caching beyond explore page (user profiles, feeds)

---

## 📝 Learning Path (Suggested Order)

If you're learning from this project, tackle features in this order:

1. ✅ Understand the existing codebase (read comments in each file)
2. Add Like/Comment integration on feed (combines frontend + API calls)
3. Build Create Post UI (learn form handling + file upload)
4. Complete Explore page (learn data fetching + grid layouts)
5. Build Notifications page (learn Socket.io on frontend)
6. Build Messages page (most complex — combines everything)
7. Add OAuth login (learn third-party integration)
8. Deploy to production (learn DevOps basics)

Each step builds on the previous one, gradually increasing complexity.

---

*Last updated: $(date)*
*Author: Psycho (VibeFeed Creator)*
