// ============================================================================
// 📁 FILE: post.controller.js (Post Controller)
// 📍 LOCATION: backend/src/controllers/post.controller.js
// 📚 TOPIC: CRUD Operations, Pagination, Redis Caching, Feed Algorithm
// 🏗️ BUILD ORDER: Step 6b — Core feature controller
// ============================================================================
//
// 🎯 PURPOSE: Handles all post-related operations — create, read, update, delete,
// feed generation, explore page, search, and user-specific posts.
//
// 🧠 KEY CONCEPTS USED HERE:
// - CRUD: Create, Read, Update, Delete operations
// - Pagination: Loading data in chunks (page 1, page 2, etc.)
// - Caching: Storing results in Redis to avoid repeated DB queries
// - Cache Invalidation: Clearing cache when data changes
// - Authorization: Ensuring only the author can edit/delete their post
//
// 🔮 FUTURE: Infinite scroll pagination (cursor-based), content moderation,
//           engagement-based feed algorithm, scheduled posts, post analytics
// ============================================================================

import Post from '../models/post.model.js'
import User from '../models/user.model.js'
import Comment from '../models/comment.model.js'
import { getRedisClient } from '../config/redis.js'  // Redis cache for performance

// ============================================================================
// CONTROLLER 1: CREATE POST
// ============================================================================
/**
 * @route   POST /api/v1/posts
 * @desc    Create a new post
 * @access  Private
 */
export const createPost = async (req, res, next) => {
  try {
    // Extract post data from request body (sent by frontend)
    const { caption, media, hashtags, location } = req.body

    // Create the post in MongoDB
    // req.user._id comes from auth middleware (the logged-in user's ID)
    const post = await Post.create({
      author: req.user._id,   // Who created this post
      caption,                // Text content
      media,                  // Array of { url, mediaType } objects
      hashtags,               // Array of hashtag strings
      location,               // Location string
    })

    // Add post reference to the user's posts array
    // $push is a MongoDB operator that adds an element to an array
    // This creates a two-way link: Post knows its author, User knows their posts
    // Add post reference to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id },
    })

    // Fetch the post again with author details populated
    // .populate() replaces the author ObjectId with the actual user document
    // Second arg limits which fields to include (we don't need password/email/etc.)
    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName profilePicture'
    )

    // ─── Cache Invalidation ──────────────────────────────────────────────
    // When a new post is created, the explore page cache is outdated
    // We delete all explore page cache keys so fresh data is fetched next time
    // TOPIC: Cache Invalidation — Removing stale cache data
    // "There are only two hard things in CS: cache invalidation and naming things"
    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      // .keys('explore_posts_*') finds all cache keys matching the pattern
      // Then .del() deletes them all
      const keys = await redisClient.keys('explore_posts_*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost,
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 2: GET FEED POSTS (Personalized Feed)
// ============================================================================
// Shows posts from users you follow + your own posts (like Instagram home feed)
/**
 * @route   GET /api/v1/posts
 * @desc    Get all posts (feed) with pagination
 * @access  Private
 */
export const getFeedPosts = async (req, res, next) => {
  try {
    // ─── Pagination ──────────────────────────────────────────────────────
    // Instead of loading ALL posts at once (slow!), we load them in pages
    // ?page=1&limit=10 → First 10 posts
    // ?page=2&limit=10 → Next 10 posts (posts 11-20)
    //
    // parseInt() converts string query params to numbers
    // || provides defaults if the query param is missing
    //
    // TOPIC: Offset-Based Pagination — Loading data in numbered pages
    // ALTERNATIVE: Cursor-based pagination (more efficient for large datasets)
    //   Uses the last item's ID/timestamp instead of page numbers
    const page = parseInt(req.query.page) || 1      // Default page 1
    const limit = parseInt(req.query.limit) || 10    // Default 10 posts per page
    const skip = (page - 1) * limit                  // How many to skip (page 2, skip first 10)

    // ─── Build the feed ──────────────────────────────────────────────────
    // The feed shows posts from users you follow AND your own posts
    // Spread operator (...) copies the following array and adds the current user
    // Get posts from users the current user follows + own posts
    const following = req.user.following            // Array of User IDs you follow
    const feedUsers = [...following, req.user._id]  // Add yourself to the list

    // Query: Find posts where author is in feedUsers AND not archived
    // $in is a MongoDB operator meaning "match any value in this array"
    const posts = await Post.find({
      author: { $in: feedUsers },   // Author must be someone we follow or ourselves
      isArchived: false,             // Don't show archived posts
    })
      .sort({ createdAt: -1 })      // Newest first (-1 = descending)
      .skip(skip)                    // Skip posts from previous pages
      .limit(limit)                  // Only return 'limit' number of posts
      .populate('author', 'username fullName profilePicture')  // Include author details
      .populate({
        // Nested populate: populate comments AND each comment's author
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },  // Only first 3 comments
        populate: { path: 'author', select: 'username profilePicture' },
      })

    // Count total matching posts (for pagination metadata)
    const total = await Post.countDocuments({
      author: { $in: feedUsers },
      isArchived: false,
    })

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),  // Total number of pages
      },
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 3: GET EXPLORE POSTS (Public discovery feed with Redis caching)
// ============================================================================
/**
 * @route   GET /api/v1/posts/explore
 * @desc    Get all public posts for explore page
 * @access  Private
 */
export const getExplorePosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // ─── Check Redis Cache First ─────────────────────────────────────────
    // Before querying MongoDB, check if we have cached results
    // Cache key includes page and limit to cache each page separately
    const redisClient = getRedisClient();
    const cacheKey = `explore_posts_${page}_${limit}`;

    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);  // Get from cache
      if (cachedData) {
        // Cache HIT — return cached data without touching MongoDB
        // JSON.parse converts the cached string back to an object
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Cache MISS — query MongoDB (explore shows ALL public posts, newest first)
    const posts = await Post.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Post.countDocuments({ isArchived: false })

    const responseData = {
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    // ─── Store in Redis Cache ────────────────────────────────────────────
    // .setEx() stores data with an expiration time
    // 600 seconds = 10 minutes (cache expires after 10 min)
    // JSON.stringify converts the object to a string (Redis only stores strings)
    if (redisClient) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData)); // Cache for 10 minutes
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 4: GET SINGLE POST BY ID
// ============================================================================
/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get a single post by ID
 * @access  Private
 */
export const getPostById = async (req, res, next) => {
  try {
    // req.params.id comes from the URL: /api/v1/posts/:id
    // :id is a route parameter — Express extracts it automatically
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username profilePicture' },
      })

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    res.status(200).json({ success: true, data: post })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 5: UPDATE POST (only by author)
// ============================================================================
/**
 * @route   PUT /api/v1/posts/:id
 * @desc    Update a post (only by author)
 * @access  Private
 */
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // ─── Authorization Check ─────────────────────────────────────────────
    // CRITICAL: Only the post author can update it
    // We compare the author's ID with the logged-in user's ID
    // .toString() is needed because MongoDB ObjectIds are objects, not strings
    // ObjectId === ObjectId would be false (object comparison), but
    // "abc123" === "abc123" would be true (string comparison)
    // TOPIC: Authorization — Ensuring users can only modify their own content
    // Only author can update
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        // 403 = Forbidden (you're authenticated but not authorized)
        success: false,
        message: 'You are not authorized to update this post',
      })
    }

    // Update only provided fields (don't overwrite with undefined)
    // The !== undefined check ensures we only update fields that were sent
    const { caption, hashtags, location } = req.body
    if (caption !== undefined) post.caption = caption
    if (hashtags !== undefined) post.hashtags = hashtags
    if (location !== undefined) post.location = location

    await post.save()  // Save triggers Mongoose validation and middleware

    const updatedPost = await Post.findById(post._id).populate(
      'author', 'username fullName profilePicture'
    )

    // Clear explore cache (data changed)
    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      const keys = await redisClient.keys('explore_posts_*');
      if (keys.length > 0) { await redisClient.del(keys); }
    }

    res.status(200).json({ success: true, message: 'Post updated successfully', data: updatedPost })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 6: DELETE POST (only by author)
// ============================================================================
/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    Delete a post (only by author)
 * @access  Private
 */
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Only author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this post' })
    }

    // Remove post reference from user's posts array
    // $pull removes elements from an array that match the condition
    // Remove post reference from user's posts array
    await User.findByIdAndUpdate(req.user._id, { $pull: { posts: post._id } })

    // Delete all comments on this post (cascade delete)
    // When a post is deleted, its comments become orphaned — delete them too
    // 🔮 FUTURE: Also delete likes, notifications related to this post
    // Delete all comments on this post
    await Comment.deleteMany({ post: post._id })

    // Delete the post document
    // Delete the post
    await Post.findByIdAndDelete(post._id)

    // Clear cache
    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      const keys = await redisClient.keys('explore_posts_*');
      if (keys.length > 0) { await redisClient.del(keys); }
    }

    res.status(200).json({ success: true, message: 'Post deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 7: GET USER POSTS (posts by a specific user — profile page)
// ============================================================================
/**
 * @route   GET /api/v1/posts/user/:userId
 * @desc    Get all posts by a specific user
 * @access  Private
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12   // 12 = fits nicely in a 3-column grid
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: req.params.userId, isArchived: false })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Post.countDocuments({ author: req.params.userId, isArchived: false })

    res.status(200).json({
      success: true, data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// CONTROLLER 8: SEARCH POSTS (by caption or hashtags)
// ============================================================================
/**
 * @route   GET /api/v1/posts/search?q=keyword
 * @desc    Search posts by caption or hashtags
 * @access  Private
 */
export const searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;  // The search query from URL: ?q=travel
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ─── Text Search with Regex ──────────────────────────────────────────
    // $regex performs pattern matching (like SQL's LIKE operator)
    // $options: 'i' makes it case-insensitive ("travel" matches "Travel")
    // $or matches posts where caption OR hashtags contain the search term
    //
    // TOPIC: MongoDB Text Search — Finding documents that match a search query
    // 🔮 FUTURE: Use MongoDB's $text search with text indexes for better performance
    //           Or use a dedicated search engine (Elasticsearch, Algolia, Meilisearch)
    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    })
    .sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate('author', 'username fullName profilePicture');

    const total = await Post.countDocuments({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    });

    res.status(200).json({
      success: true, data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}
