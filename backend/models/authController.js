import bcrypt from "bcryptjs";
import User from "./User.js";

export const registerCandidate = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const candidate = new User({ name, email: email.toLowerCase(), phone, password: hashedPassword, role: "candidate" });
    await candidate.save();
    res.status(201).json({ success: true, message: "Candidate Registered Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};