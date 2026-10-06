import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import multer from "multer";
import { spawn } from "child_process";

// ===============================
// Fixed Port Configuration
// ===============================
const PORT = process.env.PORT || 5002;


// Initialize Express App
const app = express();

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import calendarNoteRoutes from "./routes/calendarNoteRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { initInterviewReminderService } from "./services/interviewReminderService.js";
import { verifySmtpConnection } from "./services/emailService.js";




// ===============================
// Middleware
// ===============================


app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);



app.use(express.json());


app.use(

  express.urlencoded({

    extended: true

  })

);

app.use((req, res, next) => {
  console.log(`[SERVER] API request: ${req.method} ${req.originalUrl || req.url}`);
  next();
});





// ===============================
// Logo Upload Storage
// ===============================


const logoStorage = multer.diskStorage({


  destination: (req, file, cb) => {


    cb(

      null,

      "uploads/logos"

    );


  },



  filename: (req, file, cb) => {


    const fileName =

      Date.now() + "-" + file.originalname;



    cb(

      null,

      fileName

    );


  }


});





const uploadLogo = multer({

  storage: logoStorage

});







// ===============================
// Static Files
// ===============================


// Resume + Logo Access
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.use(
  "/uploads/resume",
  express.static(path.join(process.cwd(), "uploads", "resume"))
);

app.use(
  "/uploads/resumes",
  express.static(path.join(process.cwd(), "uploads", "resume"))
);




// AI Generated Posters

app.use(

  "/generated",

  express.static(

    path.join(

      process.cwd(),

      "generated"

    )

  )

);

// Also serve generated posters from the image-processing-service folder
// (posters may be created there by the Python service)
app.use(

  "/generated",

  express.static(

    path.join(

      process.cwd(),

      "image-processing-service",

      "generated"

    )

  )

);







// ===============================
// Upload Company Logo API
// ===============================


app.post(

  "/api/upload-logo",

  uploadLogo.single("logo"),

  (req, res) => {


    try {


      if (!req.file) {


        return res.status(400).json({

          success: false,

          message: "Logo file required"

        });


      }



      const logoPath =

        "/uploads/logos/" + req.file.filename;




      res.json({

        success: true,

        logo: logoPath

      });



    }

    catch (error) {


      res.status(500).json({

        success: false,

        message: error.message

      });


    }


  }

);








// ===============================
// Test / Health-check API
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI-ATS Backend API is running",
    port: 5002,
  });
});







// ===============================
// API Routes
// ===============================


app.use("/api/auth", authRoutes);



app.use(

  "/api/hr",

  hrRoutes

);



app.use(

  "/api/jobs",

  jobRoutes

);



app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/interviews",
  interviewRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/candidate",
  candidateRoutes
);



app.use(

  "/api/upload",

  uploadRoutes

);


app.use(
  "/api/resume",
  resumeRoutes
);

app.use("/api/notifications", notificationRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calendar-notes", calendarNoteRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);





// ===============================
// Request Logger & 404 Handler
// ===============================

app.use((req, res, next) => {
  console.log(`[SERVER] API request: ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use((req, res) => {
  console.log("404 REQUEST:", req.method, req.originalUrl || req.url);
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// ===============================
// Server & MongoDB Initialization
// ===============================

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ATS";

app.listen(PORT, () => {
  console.log(`[SERVER] Backend running on PORT: ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("Interview routes loaded: /api/interviews");
  console.log("Notification routes loaded: /api/notifications");

  // Connect to MongoDB
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log("✅ MongoDB Connected successfully");
      try {
        await mongoose.connection.db.collection("hr").dropIndex("firebaseUid_1");
      } catch (e) {}
    })
    .catch((error) => {
      console.error("❌ MongoDB Connection Error:", error);
    });

  // Start automatic interview reminder service
  try {
    initInterviewReminderService();
  } catch (e) {}

  // Verify Gmail SMTP Connection asynchronously
  try {
    verifySmtpConnection();
  } catch (e) {}

  // Background NLTK and spaCy initialization
  try {
    const initScriptPath = path.join(process.cwd(), "services", "ats_matcher.py");
    console.log("⏳ Starting background NLTK & spaCy auto-initialization...");
    const initProcess = spawn("python3", [initScriptPath, "--init"]);

    initProcess.stdout.on("data", (data) => {
      console.log("[Python Init]:", data.toString().trim());
    });

    initProcess.stderr.on("data", (data) => {
      console.error("[Python Init Error]:", data.toString().trim());
    });

    initProcess.on("close", (code) => {
      console.log(`✅ Background initialization exited with code ${code}`);
    });
  } catch (spawnError) {
    console.error("❌ Failed to start background Python initialization:", spawnError);
  }
});