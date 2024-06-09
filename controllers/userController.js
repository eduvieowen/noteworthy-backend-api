const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' })
    }
    res.json(users);
})

// @desc Create all users
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    // confirm data
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    };

    // confirm roles data
    if (roles && !Array.isArray(roles)) {
        return res.status(400).json({ message: 'Invalid roles input' });
    }

    // check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' });
    };

    // hash password
    const hashedPwd = await bcrypt.hash(password, 10);

    // create user with default role
    const userObj = { username, password: hashedPwd };
    const user = await User.create(userObj);

    // if roles are provided, update the user document
    if (Array.isArray(roles) && roles.length > 0) {
        user.roles = [...user.roles, ...roles];
        await user.save();
    }

    if (user) {
        res.status(201).json({ message: `New user created: ${username}` });
    } else {
        res.status(400).json({ messagge: 'Invalid user data' });
    }
});

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, isActive, password } = req.body;

    // confirm data
    if (!id || !username || typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required, invalid input' });
    };

    // confirm roles data
    if (roles && !Array.isArray(roles)) {
        return res.status(400).json({ message: 'Invalid roles input' });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    };

    // check for duplicate username
    const duplicate = await User.findOne({ username, _id: { $ne: id } }).lean().exec();
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' });
    }

    // check for duplicate roles
    if (roles) {
        const existingRoles = new Set(user.roles);
        const duplicateRoles = roles.some(role => existingRoles.has(role));

        if (duplicateRoles) {
            return res.status(409).json({ message: 'Duplicate roles assigned' });
        }

        user.roles = [...new Set([...user.roles, ...roles])];
    }

    user.username = username;
    user.isActive = isActive;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    };

    const updatedUser = await user.save();

    res.json({ message: `Updated user: ${updatedUser.username}` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'User ID required' });
    };

    const note = await Note.findOne({ user: id }).lean().exec();
    if (note) {
        return res.status(400).json({ message: 'User has assigned notes' });
    };

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    };

    await user.deleteOne();
    const reply = `User ${user.username} with ID ${user._id} deleted`;
    res.json(reply);
});

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
};

