import express from "express";
import mongoose from "mongoose";
import axios from "axios";

import Job from "../models/Job.js";
import HR from "../models/HR.js";
import Application from "../models/Application.js";
import User from "../models/User.js";


const router = express.Router();


console.log("✅ jobRoutes loaded");



// =================================================
// CREATE JOB
// =================================================

router.post("/create", async(req,res)=>{

try{


const {
  title,
  company,
  location,
  salary,
  experience,
  employmentType,
  educationRequirement,
  skills,
  description,
  lastDate,
  hrId,
  companyLogo
} = req.body;

// ===============================
// HR CHECK
// ===============================

if (!hrId) {
  return res.status(400).json({
    success: false,
    message: "HR ID required"
  });
}

let hr = await HR.findById(hrId);
if (!hr) {
  hr = await User.findById(hrId);
}

if (!hr) {
  return res.status(404).json({
    success: false,
    message: "HR not found"
  });
}

if (hr.isActive === false || hr.status === "Pending" || hr.status === "Inactive") {
  return res.status(403).json({
    success: false,
    message: "Your HR account is pending Admin activation. You cannot post jobs until an Admin activates your account."
  });
}

// ===============================
// CREATE JOB
// ===============================

const job = await Job.create({
  title,
  company,
  location,
  salary,
  experience,
  employmentType,
  educationRequirement: educationRequirement || "Any Education",
  skills: Array.isArray(skills)
    ? skills
    : skills
    ? skills.split(",").map((item) => item.trim())
    : [],
  requiredSkills: Array.isArray(skills)
    ? skills
    : skills
    ? skills.split(",").map((item) => item.trim())
    : [],
  description,
  lastDate,
  hrId: hr._id,
  hrName: hr.name,
  hrEmail: hr.email,
  companyLogo: companyLogo || "",
  posters: [],
  selectedPoster: "",
  posterGenerationStatus: "Generating"
});

console.log("✅ Job Created:", job._id);

// =================================================
// CALL PYTHON POSTER SERVICE
// =================================================

try {
  const response = await axios.post(
    "http://127.0.0.1:8000/generate-posters",
    {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      experience: job.experience,
      employmentType: job.employmentType,
      skills: job.skills,
      description: job.description,
      companyLogo: job.companyLogo
    },
    { timeout: 8000 }
  );





console.log(
"PYTHON RESPONSE:",
response.data
);





if(response.data.success){



// Fix poster path

const posterList =
response.data.posters.map(

(poster)=>{


if(poster.startsWith("/")){

return poster;

}


return "/" + poster;


}

);





job.posters = posterList;



job.selectedPoster = posterList[0];



job.posterGenerationStatus =
"Completed";



await job.save();



console.log(
"✅ Posters Saved MongoDB",
job.posters
);



}

else{


job.posterGenerationStatus="Failed";

await job.save();


}





}

catch(error){



console.log(
"❌ Poster Generation Error:",
error.message
);



job.posterGenerationStatus="Failed";


await job.save();



}






return res.status(201).json({

success:true,

message:"Job created successfully",

job

});




}

catch(error){


console.log(
"Create Job Error:",
error
);



return res.status(500).json({

success:false,

message:error.message

});


}


});









// =================================================
// UPDATE JOB DETAILS
// =================================================
router.put("/update/:id", async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      experience,
      employmentType,
      educationRequirement,
      skills,
      description,
      lastDate,
      companyLogo,
    } = req.body;

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const updatePayload = {
      ...(title !== undefined && { title }),
      ...(company !== undefined && { company }),
      ...(location !== undefined && { location }),
      ...(salary !== undefined && { salary }),
      ...(experience !== undefined && { experience }),
      ...(employmentType !== undefined && { employmentType }),
      ...(educationRequirement !== undefined && { educationRequirement }),
      ...(skills !== undefined && { skills: parsedSkills, requiredSkills: parsedSkills }),
      ...(description !== undefined && { description }),
      ...(lastDate !== undefined && { lastDate }),
      ...(companyLogo !== undefined && { companyLogo }),
    };

    const job = await Job.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      experience,
      employmentType,
      educationRequirement,
      skills,
      description,
      lastDate,
      companyLogo,
    } = req.body;

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const updatePayload = {
      ...(title !== undefined && { title }),
      ...(company !== undefined && { company }),
      ...(location !== undefined && { location }),
      ...(salary !== undefined && { salary }),
      ...(experience !== undefined && { experience }),
      ...(employmentType !== undefined && { employmentType }),
      ...(educationRequirement !== undefined && { educationRequirement }),
      ...(skills !== undefined && { skills: parsedSkills, requiredSkills: parsedSkills }),
      ...(description !== undefined && { description }),
      ...(lastDate !== undefined && { lastDate }),
      ...(companyLogo !== undefined && { companyLogo }),
    };

    const job = await Job.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =================================================
// UPDATE SELECTED POSTER
// =================================================


router.put("/:id/poster",async(req,res)=>{


try{


const job =
await Job.findByIdAndUpdate(

req.params.id,

{

selectedPoster:req.body.selectedPoster

},

{
new:true
}

);




if(!job){


return res.status(404).json({

success:false,

message:"Job not found"

});


}




res.json({

success:true,

message:"Poster selected successfully",

job

});



}


catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});









// =================================================
// GET ALL JOBS
// =================================================


router.get("/",async(req,res)=>{


try{


const jobs =
await Job.find()

.sort({

createdAt:-1

});



res.json(jobs);



}

catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});









// =================================================
// GET HR JOBS
// =================================================


router.get("/hr/:hrId", async (req, res) => {
  try {
    const { hrId } = req.params;

    console.log(`[HR JOB DEBUG] Request received for HR ID/Email: "${hrId}"`);

    if (!hrId || hrId === "all" || hrId === "admin" || hrId === "undefined" || hrId === "null") {
      const jobs = await Job.find({}).sort({ createdAt: -1 });
      console.log(`[HR JOB DEBUG] Returning all jobs (${jobs.length}) for admin/all request`);
      return res.json(jobs);
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(hrId)) {
      let hr = await HR.findById(hrId);
      if (!hr) hr = await User.findById(hrId);

      if (hr && hr.email) {
        query = {
          $or: [
            { hrId: hr._id },
            { hrId: hrId },
            { hrEmail: hr.email.toLowerCase() },
            { hrEmail: hr.email }
          ]
        };
      } else {
        query = {
          $or: [
            { hrId: hrId },
            { hrEmail: hrId }
          ]
        };
      }
    } else {
      query = {
        $or: [
          { hrEmail: hrId.toLowerCase() },
          { hrEmail: hrId }
        ]
      };
    }

    let jobs = await Job.find(query).sort({ createdAt: -1 });

    if (jobs.length === 0 && mongoose.Types.ObjectId.isValid(hrId)) {
      jobs = await Job.find({ hrId }).sort({ createdAt: -1 });
    }

    console.log(`[HR JOB DEBUG] Authenticated HR user ID: ${hrId}, Jobs found: ${jobs.length}`);

    return res.json(jobs);
  } catch (error) {
    console.error("[HR JOB DEBUG Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});









// =================================================
// GET SINGLE JOB
// =================================================


router.get("/:id",async(req,res)=>{


try{


const job =
await Job.findById(req.params.id);



if(!job){


return res.status(404).json({

success:false,

message:"Job not found"

});


}



res.json({

success:true,

job

});



}

catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});









// =================================================
// GET JOB DETAILS (Stats, Scores, Timeline)
// =================================================

router.get("/:id/details", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const applications = await Application.find({ jobId: req.params.id })
      .populate("candidateId")
      .sort({ createdAt: -1 });

    const totalApplications = applications.length;
    let accepted = 0;
    let rejected = 0;
    let pending = 0;
    let shortlisted = 0;
    let interviewScheduled = 0;
    let totalScore = 0;
    let highestAtsScore = 0;
    let lowestAtsScore = totalApplications > 0 ? 100 : 0;

    applications.forEach((app) => {
      const score = app.matchScore || 0;
      totalScore += score;
      if (score > highestAtsScore) highestAtsScore = score;
      if (score < lowestAtsScore) lowestAtsScore = score;

      if (app.status === "Accepted") accepted++;
      else if (app.status === "Rejected") rejected++;
      else if (app.status === "Shortlisted") shortlisted++;
      else if (app.status === "Interview Scheduled") interviewScheduled++;
      else pending++;
    });

    const avgAtsScore = totalApplications > 0 ? Math.round(totalScore / totalApplications) : 0;

    const timeline = applications.map((app) => ({
      _id: app._id,
      candidateName: app.candidateName || app.candidateId?.name || "Candidate",
      candidateEmail: app.candidateEmail || app.candidateId?.email || "N/A",
      matchScore: app.matchScore || 0,
      status: app.status || "Applied",
      appliedDate: app.createdAt,
      interviewDetails: app.interviewDetails || {},
    }));

    return res.json({
      success: true,
      job,
      stats: {
        totalApplications,
        accepted,
        rejected,
        pending,
        shortlisted,
        interviewScheduled,
        avgAtsScore,
        highestAtsScore,
        lowestAtsScore: totalApplications > 0 ? lowestAtsScore : 0,
      },
      timeline,
    });
  } catch (error) {
    console.error("Job Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =================================================
// DELETE JOB (Cascading delete of applications & notifications)
// =================================================

router.delete("/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Cascading Delete:
    // 1. Delete all applications related to this job
    const appDeleteResult = await Application.deleteMany({ jobId });

    // 2. Remove notifications referencing this jobId from all candidate users
    await User.updateMany(
      {},
      { $pull: { notifications: { jobId } } }
    );

    // 3. Delete the Job record itself
    await Job.findByIdAndDelete(jobId);

    return res.json({
      success: true,
      message: `Job deleted successfully along with ${appDeleteResult.deletedCount} related applications.`,
      deletedJobId: jobId,
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;