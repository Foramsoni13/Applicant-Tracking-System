import express from "express";
import CalendarNote from "../models/CalendarNote.js";

const router = express.Router();

// Get all calendar notes for an HR
router.get("/", async (req, res) => {
  try {
    const { hrId } = req.query;
    const filter = {};
    if (hrId) filter.hrId = hrId;

    const notes = await CalendarNote.find(filter).sort({ date: 1, createdAt: 1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching calendar notes:", error);
    res.status(500).json({ success: false, message: "Server error fetching notes." });
  }
});

// Add a calendar note
router.post("/", async (req, res) => {
  try {
    const { date, hrId, text, createdBy } = req.body;
    
    if (!date || !text || !hrId) {
      return res.status(400).json({ success: false, message: "Date, text, and HR ID are required." });
    }

    const newNote = await CalendarNote.create({
      date,
      hrId,
      text,
      createdBy: createdBy || "HR"
    });

    res.status(201).json({ success: true, message: "Note added.", data: newNote });
  } catch (error) {
    console.error("Error creating calendar note:", error);
    res.status(500).json({ success: false, message: "Server error adding note." });
  }
});

// Delete a calendar note
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await CalendarNote.findByIdAndDelete(id);
    res.json({ success: true, message: "Note deleted." });
  } catch (error) {
    console.error("Error deleting calendar note:", error);
    res.status(500).json({ success: false, message: "Server error deleting note." });
  }
});

export default router;
