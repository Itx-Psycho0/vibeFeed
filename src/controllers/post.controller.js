import Post from '../models/post.model.js'
import User from '../models/user.model.js'
import Comment from '../models/comment.model.js'
import { getRedisClient } from '../config/redis.js'

/**
 * @route   POST /api/v1/posts
 * @desc    Create a new post
 * @access  Private
 */
export const createPost = async (req, res, next) => {
  try {
    const { caption, media, hashtags, location } = req.body

    const post = await Post.create({
      author: req.user._id,
      caption,
      media,
      hashtags,
      location,
    })

    // Add post reference to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id },
    })

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName profilePicture'
    )

    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
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

/**
 * @route   GET /api/v1/posts
 * @desc    Get all posts (feed) with pagination
 * @access  Private
 */
export const getFeedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Get posts from users the current user follows + own posts
    const following = req.user.following
    const feedUsers = [...following, req.user._id]

    const posts = await Post.find({
      author: { $in: feedUsers },
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'username profilePicture' },
      })

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
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

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

    const redisClient = getRedisClient();
    const cacheKey = `explore_posts_${page}_${limit}`;

    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const posts = await Post.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Post.countDocuments({ isArchived: false })

    const responseData = {
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (redisClient) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData)); // Cache for 10 minutes
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get a single post by ID
 * @access  Private
 */
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username profilePicture' },
      })

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    res.status(200).json({
      success: true,
      data: post,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PUT /api/v1/posts/:id
 * @desc    Update a post (only by author)
 * @access  Private
 */
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Only author can update
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this post',
      })
    }

    const { caption, hashtags, location } = req.body
    if (caption !== undefined) post.caption = caption
    if (hashtags !== undefined) post.hashtags = hashtags
    if (location !== undefined) post.location = location

    await post.save()

    const updatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName profilePicture'
    )

    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      const keys = await redisClient.keys('explore_posts_*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    Delete a post (only by author)
 * @access  Private
 */
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Only author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      })
    }

    // Remove post reference from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: post._id },
    })

    // Delete all comments on this post
    await Comment.deleteMany({ post: post._id })

    // Delete the post
    await Post.findByIdAndDelete(post._id)

    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      const keys = await redisClient.keys('explore_posts_*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/v1/posts/user/:userId
 * @desc    Get all posts by a specific user
 * @access  Private
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    const posts = await Post.find({
      author: req.params.userId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')

    const total = await Post.countDocuments({
      author: req.params.userId,
      isArchived: false,
    })

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}
