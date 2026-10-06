import mongoose from "mongoose";


const jobSchema = new mongoose.Schema(
{

// ==========================================
// Job Information
// ==========================================

title:{
    type:String,
    required:true,
    trim:true
},


company:{
    type:String,
    required:true,
    trim:true
},


location:{
    type:String,
    required:true,
    trim:true
},


salary:{
    type:String,
    default:""
},


experience:{
    type:String,
    default:""
},


employmentType:{
    type:String,
    default:""
},


educationRequirement:{
    type:String,
    default:"Any Education",
    trim:true
},


skills:[
    {
        type:String,
        trim:true
    }
],


requiredSkills:[
    {
        type:String,
        trim:true
    }
],


description:{
    type:String,
    required:true
},


// ==========================================
// Combined Searchable Document for TF-IDF
// ==========================================

searchableDocument:{
    type:String,
    default:""
},


lastDate:{
    type:Date
},


postedDate:{
    type:Date,
    default:Date.now
},




// ==========================================
// HR Information
// ==========================================

hrId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"HR",
    required:true
},


hrName:{
    type:String,
    required:true,
    trim:true
},


hrEmail:{
    type:String,
    required:true,
    trim:true
},




// ==========================================
// Company Logo
// ==========================================

companyLogo:{
    type:String,
    default:""
},




// ==========================================
// AI Generated Posters
// ==========================================


posters:[
    {
        type:String
    }
],



selectedPoster:{
    type:String,
    default:""
},




posterGenerationStatus:{
    type:String,

    enum:[

        "Pending",
        "Generating",
        "Completed",
        "Failed"

    ],

    default:"Pending"
}



},

{

timestamps:true

}

);



const Job = mongoose.model(
"Job",
jobSchema
);



export default Job;