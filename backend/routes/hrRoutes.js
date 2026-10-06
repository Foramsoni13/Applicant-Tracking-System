import express from "express";
import bcrypt from "bcryptjs";
import HR from "../models/HR.js";
import SystemSetting from "../models/SystemSetting.js";

const router = express.Router();

console.log("HR ROUTES CONNECTED");

// ADMIN CREATE HR / HR REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, company, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingHR = await HR.findOne({
      email: email.toLowerCase(),
    });

    if (existingHR) {
      return res.status(400).json({
        success: false,
        message: "HR already exists",
      });
    }

    // Check system setting for auto-activation
    const autoActivateSetting = await SystemSetting.findOne({ key: "autoActivateHr" });
    const autoActivate = autoActivateSetting ? autoActivateSetting.value !== false : true;

    const hashedPassword = await bcrypt.hash(password || "Password123", 10);

    const hr = await HR.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || "",
      company: company || "",
      department: department || "",
      role: "hr",
      status: autoActivate ? "Active" : "Pending",
      isActive: autoActivate,
      atsThreshold: 60,
    });

    return res.status(201).json({
      success: true,
      message: autoActivate
        ? "HR account registered and activated successfully."
        : "HR account registered. Pending Admin activation.",
      hr,
    });
  } catch (error) {
    console.error("HR SAVE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET HR Settings (atsThreshold)
router.get("/settings/:hrId", async (req, res) => {
  try {
    const { hrId } = req.params;
    const hr = await HR.findById(hrId);
    if (!hr) {
      return res.status(404).json({ success: false, message: "HR account not found" });
    }

    return res.json({
      success: true,
      settings: {
        atsThreshold: typeof hr.atsThreshold === "number" ? hr.atsThreshold : 60,
      },
    });
  } catch (error) {
    console.error("GET HR SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE HR Settings (atsThreshold)
router.put("/settings/:hrId", async (req, res) => {
  try {
    const { hrId } = req.params;
    const { atsThreshold } = req.body;

    const numThreshold = Number(atsThreshold);
    if (isNaN(numThreshold) || numThreshold < 0 || numThreshold > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid threshold value. Must be a percentage between 0 and 100.",
      });
    }

    const hr = await HR.findById(hrId);
    if (!hr) {
      return res.status(404).json({ success: false, message: "HR account not found" });
    }

    hr.atsThreshold = numThreshold;
    await hr.save();

    return res.json({
      success: true,
      message: "ATS Threshold updated successfully",
      settings: {
        atsThreshold: hr.atsThreshold,
      },
    });
  } catch (error) {
    console.error("UPDATE HR SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;