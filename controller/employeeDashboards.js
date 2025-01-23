const express = require('express');
const router = express.Router();
const EmployeeDash = require('../model/employeeDashModel');

//Excel Sheet
router.post('/employeeExcelSheet', async (req, res) => {
    try {
        const { tables, employeeId } = req.body;
        
        // Check if employeeId exists
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        // Check if an excel sheet already exists for this employee
        let existingSheet = await EmployeeDash.findOne({ 
            employeeId: employeeId,
            excelSheet: { $exists: true }
        });

        if (existingSheet) {
            // Update existing sheet
            existingSheet.excelSheet = JSON.stringify(tables);
            await existingSheet.save();
            res.json({
                _id: existingSheet._id,
                tables: JSON.parse(existingSheet.excelSheet)
            });
        } else {
            // Create new sheet
            const newExcelSheet = new EmployeeDash({
                employeeId: employeeId,
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

router.get('/employeeExcelSheet/:employeeId', async (req, res) => {
    try {
        const excelSheet = await EmployeeDash.findOne({ 
            employeeId: req.params.employeeId,
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

router.put('/employeeExcelSheet/:id', async (req, res) => {
    try {
        const { tables, employeeId } = req.body;
        
        // Check if employeeId exists
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        // Add validation to ensure at least one table remains
        if (!Array.isArray(tables) || tables.length === 0) {
            return res.status(400).json({ message: 'At least one table must exist' });
        }

        const updatedExcelSheet = await EmployeeDash.findOneAndUpdate(
            {
                _id: req.params.id,
                employeeId: employeeId
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

router.delete('/employeeExcelSheet/:id', async (req, res) => {
    try {
        await EmployeeDash.findByIdAndDelete(req.params.id);
        res.json({ message: 'Excel sheet deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


//NotePad
router.post('/employeeNotePad', async (req, res) => {
    try {
        const { notes, employeeId } = req.body;
        
        // Check if employeeId exists
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        // Check if a notepad already exists for this employee
        let existingNotePad = await EmployeeDash.findOne({ 
            employeeId: employeeId,
            notePad: { $exists: true }
        });

        if (existingNotePad) {
            // Update existing notepad
            existingNotePad.notePad = notes;
            await existingNotePad.save();
            res.json({
                _id: existingNotePad._id,
                notes: existingNotePad.notePad
            });
        } else {
            // Create new notepad
            const newNotePad = new EmployeeDash({
                employeeId: employeeId,
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

router.get('/employeeNotePad/:employeeId', async (req, res) => {
    try {
        const notePad = await EmployeeDash.findOne({ 
            employeeId: req.params.employeeId,
            notePad: { $exists: true } 
        });
        
        // If no notepad exists or notepad field is null/undefined, return empty string
        if (!notePad || !notePad.notePad) {
            return res.json({ 
                _id: null,
                notes: '' 
            });
        }

        res.json({ 
            _id: notePad._id,
            notes: notePad.notePad 
        });
    } catch (error) {
        console.error('Get NotePad Error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.put('/employeeNotePad/:id', async (req, res) => {
    try {
        const { notes, employeeId } = req.body;
        
        // Check if employeeId exists
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        const updatedNotePad = await EmployeeDash.findOneAndUpdate(
            {
                _id: req.params.id,
                employeeId: employeeId // Ensure we're updating the correct employee's notepad
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

router.delete('/employeeNotePad/:id', async (req, res) => {
    try {
        // Find and remove the notepad field from the document
        const result = await EmployeeDash.findByIdAndUpdate(
            req.params.id,
            { 
                $unset: { notePad: 1 } // This removes the notePad field entirely
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'NotePad not found' });
        }

        res.json({ message: 'NotePad deleted successfully' });
    } catch (error) {
        console.error('Delete NotePad Error:', error);
        res.status(500).json({ message: error.message });
    }
});


//Todo List
router.post('/employeeTodoList', async (req, res) => {
    try {
        const { todos, employeeId } = req.body;
        const newTodoList = new EmployeeDash({
            employeeId,
            todoList: JSON.stringify(todos)
        });
        await newTodoList.save();
        res.status(201).json(newTodoList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/employeeTodoList/:employeeId', async (req, res) => {
    try {
        const todoList = await EmployeeDash.findOne({ 
            employeeId: req.params.employeeId,
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

router.put('/employeeTodoList/:id', async (req, res) => {
    try {
        const { todos } = req.body;
        const updatedTodoList = await EmployeeDash.findByIdAndUpdate(
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

router.delete('/employeeTodoList/:id', async (req, res) => {
    try {
        await EmployeeDash.findByIdAndDelete(req.params.id);
        res.json({ message: 'TodoList deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update the route for getting colors
router.get('/employeeColors/:employeeId', async (req, res) => {
    try {
        const employeeDash = await EmployeeDash.findOne({ employeeId: req.params.employeeId });
        
        if (!employeeDash) {
            return res.json({
                notepadColor: '#fff3cd',
                todoColor: '#cfe2ff',
                excelSheetColors: []
            });
        }
        
        res.json({
            notepadColor: employeeDash.notepadColor || '#fff3cd',
            todoColor: employeeDash.todoColor || '#cfe2ff',
            excelSheetColors: JSON.parse(employeeDash.excelSheetColors || '[]')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update the route for setting colors
router.put('/employeeColors/:employeeId', async (req, res) => {
    try {
        const { notepadColor, todoColor, excelSheetColors } = req.body;
        
        const updatedDash = await EmployeeDash.findOneAndUpdate(
            { employeeId: req.params.employeeId },
            { 
                $set: { 
                    notepadColor,
                    todoColor,
                    excelSheetColors: JSON.stringify(excelSheetColors)
                } 
            },
            { new: true, upsert: true }
        );
        
        res.json({
            notepadColor: updatedDash.notepadColor,
            todoColor: updatedDash.todoColor,
            excelSheetColors: JSON.parse(updatedDash.excelSheetColors || '[]')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;