import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    degree: { type: String, default: "" },
    institution: { type: String, default: "" },
    year: { type: String, default: "" },
    cgpa: { type: String, default: "" }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    duration: { type: String, default: "" },
    description: { type: String, default: "" }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    technologies: [{ type: String, trim: true }]
}, { _id: false });

const resumeSchema = new mongoose.Schema({

    candidateId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    fileName:{
        type:String,
        required:true
    },

    filePath:{
        type:String,
        required:true
    },

    fileType:{
        type:String,
        default:""
    },

    fileSize:{
        type:Number,
        default:0
    },

    // ==========================================
    // Extracted Resume Data
    // ==========================================

    extractedText:{
        type:String,
        default:""
    },

    extractedSkills:[{
        type:String,
        trim:true
    }],

    skills:[{
        type:String,
        trim:true
    }],

    education:[educationSchema],

    experience:[experienceSchema],

    projects:[projectSchema],

    certifications:[{
        type:String,
        trim:true
    }],

    languages:[{
        type:String,
        trim:true
    }],

    achievements:[{
        type:String,
        trim:true
    }],

    technologies:[{
        type:String,
        trim:true
    }],

    phone:{
        type:String,
        default:""
    },

    email:{
        type:String,
        default:""
    },

    location:{
        type:String,
        default:""
    },

    candidateName:{
        type:String,
        default:""
    },

    linkedin:{
        type:String,
        default:""
    },

    github:{
        type:String,
        default:""
    },

    // ==========================================
    // ATS Quality Score (standalone scan, no job)
    // ==========================================

    atsScore:{
        type:Number,
        default:0
    },

    breakdown:{
        skills:        { type:Number, default:0 },
        experience:    { type:Number, default:0 },
        education:     { type:Number, default:0 },
        projects:      { type:Number, default:0 },
        certifications:{ type:Number, default:0 },
        resumeCompleteness:{ type:Number, default:0 }
    },

    recommendations:[{
        type:String,
        trim:true
    }],

    // ==========================================
    // Scan Status
    // ==========================================

    scanStatus:{
        type:String,
        enum:["Pending","Scanning","Completed","Failed"],
        default:"Pending"
    },

    uploadedAt:{
        type:Date,
        default:Date.now
    }

});


export default mongoose.model(
    "Resume",
    resumeSchema
);