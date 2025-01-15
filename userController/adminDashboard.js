const express = require('express');
const router = express.Router();
const AdminDash = require('../userModel/adminDashModel');

//Excel Sheet
router.post('/adminExcelSheet', async (req, res) => {
    try {
        const { tables, email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        let existingSheet = await AdminDash.findOne({ 
            email: email,
            excelSheet: { $exists: true }
        });

        if (existingSheet) {
            existingSheet.excelSheet = JSON.stringify(tables);
            await existingSheet.save();
            res.json({
                _id: existingSheet._id,
                tables: JSON.parse(existingSheet.excelSheet)
            });
        } else {
            const newExcelSheet = new AdminDash({
                email: email,
                excelSheet: JSON.stringify(tables)
            });
            await newExcelSheet.save();
            res.status(201).json({
                _id: newExcelSheet._id,
                tables: JSON.parse(newExcelSheet.excelSheet)
            });
        }
    } catch (error) {
        console.error('Excel Sheet Error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/adminExcelSheet/:email', async (req, res) => {
    try {
        const excelSheet = await AdminDash.findOne({ 
            email: req.params.email,
            excelSheet: { $exists: true } 
        });
        res.json({ 
            _id: excelSheet?._id,
            tables: excelSheet ? JSON.parse(excelSheet.excelSheet) : [] 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/adminExcelSheet/:id', async (req, res) => {
    try {
        const { tables, email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!Array.isArray(tables) || tables.length === 0) {
            return res.status(400).json({ message: 'At least one table must exist' });
        }

        const updatedExcelSheet = await AdminDash.findOneAndUpdate(
            {
                _id: req.params.id,
                email: email
            },
            { excelSheet: JSON.stringify(tables) },
            { new: true }
        );
        
        if (!updatedExcelSheet) {
            return res.status(404).json({ message: 'Excel sheet not found' });
        }
        
        res.json({
            _id: updatedExcelSheet._id,
            tables: JSON.parse(updatedExcelSheet.excelSheet)
        });
    } catch (error) {
        console.error('Excel Sheet Update Error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/adminExcelSheet/:id', async (req, res) => {
    try {
        await AdminDash.findByIdAndDelete(req.params.id);
        res.json({ message: 'Excel sheet deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//NotePad
router.post('/adminNotePad', async (req, res) => {
    try {
        const { notes, email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        let existingNotePad = await AdminDash.findOne({ 
            email: email,
            notePad: { $exists: true }
        });

        if (existingNotePad) {
            existingNotePad.notePad = notes;
            await existingNotePad.save();
            res.json({
                _id: existingNotePad._id,
                notes: existingNotePad.notePad
            });
        } else {
            const newNotePad = new AdminDash({
                email: email,
                notePad: notes
            });
            await newNotePad.save();
            res.status(201).json({
                _id: newNotePad._id,
                notes: newNotePad.notePad
            });
        }
    } catch (error) {
        console.error('NotePad Error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/adminNotePad/:email', async (req, res) => {
    try {
        const notePad = await AdminDash.findOne({ 
            email: req.params.email,
            notePad: { $exists: true } 
        });
        res.json({ notes: notePad ? notePad.notePad : '' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/adminNotePad/:id', async (req, res) => {
    try {
        const { notes, email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const updatedNotePad = await AdminDash.findOneAndUpdate(
            {
                _id: req.params.id,
                email: email
            },
            { notePad: notes },
            { new: true }
        );

        if (!updatedNotePad) {
            return res.status(404).json({ message: 'NotePad not found' });
        }

        res.json({
            _id: updatedNotePad._id,
            notes: updatedNotePad.notePad
        });
    } catch (error) {
        console.error('NotePad Update Error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/adminNotePad/:id', async (req, res) => {
    try {
        await AdminDash.findByIdAndDelete(req.params.id);
        res.json({ message: 'NotePad deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Todo List
router.post('/adminTodoList', async (req, res) => {
    try {
        const { todos, email } = req.body;
        const newTodoList = new AdminDash({
            email: email,
            todoList: JSON.stringify(todos)
        });
        await newTodoList.save();
        res.status(201).json(newTodoList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/adminTodoList/:email', async (req, res) => {
    try {
        const todoList = await AdminDash.findOne({ 
            email: req.params.email,
            todoList: { $exists: true } 
        });
        const todos = todoList ? JSON.parse(todoList.todoList) : [];
        res.json({ 
            _id: todoList?._id,
            todos: todos 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/adminTodoList/:id', async (req, res) => {
    try {
        const { todos } = req.body;
        const updatedTodoList = await AdminDash.findByIdAndUpdate(
            req.params.id,
            { todoList: JSON.stringify(todos) },
            { new: true }
        );
        
        if (!updatedTodoList) {
            return res.status(404).json({ message: 'Todo list not found' });
        }
        
        res.json({
            _id: updatedTodoList._id,
            todos: JSON.parse(updatedTodoList.todoList)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/adminTodoList/:id', async (req, res) => {
    try {
        await AdminDash.findByIdAndDelete(req.params.id);
        res.json({ message: 'TodoList deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Colors
router.get('/adminColors/:email', async (req, res) => {
    try {
        const adminDash = await AdminDash.findOne({ email: req.params.email });
        
        if (!adminDash) {
            return res.json({
                notepadColor: '#fff3cd',
                todoColor: '#cfe2ff',
                excelSheetColors: {}
            });
        }
        
        res.json({
            notepadColor: adminDash.notepadColor || '#fff3cd',
            todoColor: adminDash.todoColor || '#cfe2ff',
            excelSheetColors: adminDash.excelSheetColors || {}
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/adminColors/:email', async (req, res) => {
    try {
        const { notepadColor, todoColor, excelSheetColors } = req.body;
        
        const updatedDash = await AdminDash.findOneAndUpdate(
            { email: req.params.email },
            { 
                $set: { 
                    notepadColor,
                    todoColor,
                    excelSheetColors
                } 
            },
            { new: true, upsert: true }
        );
        
        res.json({
            notepadColor: updatedDash.notepadColor,
            todoColor: updatedDash.todoColor,
            excelSheetColors: updatedDash.excelSheetColors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
