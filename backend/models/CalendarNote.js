import mongoose from "mongoose";

const CalendarNoteSchema = new mongoose.Schema({
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
  },
  hrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HR",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    default: "HR",
  }
}, { timestamps: true });

export default mongoose.model("CalendarNote", CalendarNoteSchema);
