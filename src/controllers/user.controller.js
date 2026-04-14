import User from '../models/user.model.js';

export const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Basic validation
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: username, email, password, and fullName',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or username already exists',
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password, // Mongoose pre-save hook handles hashing
            fullName,
        });

        // Return user data without password
        const createdUser = await User.findById(user._id).select('-password');

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: createdUser,
        });
    } catch (error) {
        next(error); // Pass error to global error handler
    }
};
