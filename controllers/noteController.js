const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
// const bcrypt = require('bcrypt');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    };

    // Add username to each note before sending the response 
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec();
        return { ...note, username: user.username };
    }))
    res.json(notesWithUser);
})

// @desc Create all notes
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;

    // confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required, invalid input' })
    }

    // check for duplicate title
    // const duplicate = await Note.findOne({ title }).lean().exec();

    // if (duplicate) {
    //     return res.status(409).json({ message: 'Duplicate note title' });
    // };

    // create note
    const noteObj = { user, title, text };
    const note = await Note.create(noteObj);

    if (note) {
        res.status(201).json({ message: `New note created: ${title}` });
    } else {
        res.status(400).json({ messagge: 'Invalid note data received' });
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, isCompleted } = req.body;

    // confirm data
    if (!id || !user || !title || !text || typeof isCompleted !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required, invalid input' });
    }
    const note =  await Note.findOne(id).exec();

    if (!note) {
        return res.status(400).json({ message: 'Note not found' });
    };

    // check for duplicate title
    // const duplicate = await Note.findOne({ title }).lean().exec()

    // allow updates for the original note 
    // if (duplicate && duplicate?._id.toString() !== id) {
    //     return res.status(409).json({ message: 'Duplicate note title' })
    // }

    note.user = user;
    note.title = title;
    note.text = text;
    note.isCompleted = isCompleted;

    const updatedNote = await note.save();

    res.json({ message: `Updated note: ${updatedNote.title}` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body;

    // confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID required' });
    };

    // confirm note exisits
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    };

    const result = await note.deleteOne();

    const reply = `Note '${result.title}' with ID ${result._id} deleted`;

    res.json(reply)

    // const note = await Note.findOne({ note: ticketNums }).exec();
    // console.log("This is note", note);

    // const noteUser = note.user;
    // const noteUserRoles = User.findOne({ user: noteUser }).lean().exec();
    // if (noteUserRoles !== "Manager" || noteUserRoles !== "Admin") {
    //     return res.status(400).json({ message: 'Must be a Manager or Admin to delete note' });
    // };

    // // const user = await User.findById(id).exec();

    // if (!note) {
    //     return res.status(400).json({ message: 'Note not found' });
    // };

    // await note.deleteOne();
    // const reply = `Note with title "${note.title}" with ticket number ${note.ticketNums} deleted`;
    // res.json(reply);
});

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
};

