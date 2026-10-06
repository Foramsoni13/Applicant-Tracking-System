import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ================= Register Candidate =================
export const registerCandidate = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const candidate = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "candidate",
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Candidate Registered Successfully",
      user: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= Login Candidate =================
export const loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const candidate = await User.findOne({ email: email.toLowerCase() });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const match = await bcrypt.compare(password, candidate.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
