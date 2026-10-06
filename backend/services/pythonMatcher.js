import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const calculateMatchScorePython = (filePath, jobDescription, jobSkills, jobExperience) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "ats_matcher.py");
    const pythonProcess = spawn("python3", [scriptPath]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}`));
      }

      if (!stdout.trim()) {
        console.error("Python returned empty stdout.");
        console.error(stderr);
        return reject(new Error("Python script returned empty output."));
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (err) {
        console.error("Raw stdout:");
        console.error(stdout);
        console.error("Raw stderr:");
        console.error(stderr);
        return reject(err);
      }

      // Python returned a structured error
      if (parsed.error && !parsed.success) {
        console.error("Python script error:", parsed.error);
        return resolve({
          success: false,
          atsScore: 0,
          status: "Not Qualified",
          breakdown: {
            skills: 0,
            experience: 0,
            education: 0,
            projects: 0,
            certifications: 0,
            resumeCompleteness: 0
          },
          matchScore: 0,
          matchedSkills: [],
          missingSkills: jobSkills || [],
          extraSkills: [],
          resumeStatus: "Rejected",
          rejectionReason: parsed.error,
          textSimilarity: 0,
          skillMatchRate: 0,
          keywordMatchScore: 0,
          skillsMatchScore: 0,
          experienceMatchScore: 0,
          educationMatchScore: 0,
          projectMatchScore: 0,
          overallAtsScore: 0,
          extractedSkills: [],
          skills: [],
          education: [],
          experience: [],
          projects: [],
          certifications: [],
          languages: [],
          achievements: [],
          recommendations: [],
          parseError: parsed.error,
        });
      }

      // Map Python output to JS expected format
      const atsScore = parsed.atsScore !== undefined ? parsed.atsScore : (parsed.overall_ats_score || 0);
      const status = parsed.status || (atsScore >= 75 ? "Qualified" : (atsScore >= 60 ? "Partially Qualified" : "Not Qualified"));
      const breakdown = parsed.breakdown || {
        skills: Math.round((parsed.skills_match_score || 0) * 0.4),
        experience: Math.round((parsed.experience_match_score || 0) * 0.2),
        education: Math.round((parsed.education_match_score || 0) * 0.15),
        projects: Math.round((parsed.project_match_score || 0) * 0.15),
        certifications: 0,
        resumeCompleteness: 5
      };

      resolve({
        success: true,
        atsScore,
        status,
        breakdown,
        matchScore: atsScore,
        matchedSkills: parsed.matched_skills || [],
        missingSkills: parsed.missing_skills || [],
        extraSkills: parsed.extra_skills || [],
        resumeStatus: parsed.status_backend || (atsScore >= 60 ? "Accepted" : "Rejected"),
        rejectionReason: (parsed.rejection_reasons || []).join(" ") || "",
        textSimilarity: parsed.keyword_match_score || 0,
        skillMatchRate: parsed.skills_match_score || 0,
        keywordMatchScore: parsed.keyword_match_score || 0,
        skillsMatchScore: parsed.skills_match_score || 0,
        experienceMatchScore: parsed.experience_match_score || 0,
        educationMatchScore: parsed.education_match_score || 0,
        projectMatchScore: parsed.project_match_score || 0,
        overallAtsScore: atsScore,
        extractedText: parsed.extracted_text || "",
        rawText: parsed.raw_text || "",
        resumeSummary: parsed.resume_summary || "",
        candidateName: parsed.candidate_name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        linkedin: parsed.linkedin || "",
        github: parsed.github || "",
        location: parsed.location || "",
        education: parsed.education || [],
        experience: parsed.experience || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
        languages: parsed.languages || [],
        achievements: parsed.achievements || [],
        extractedSkills: parsed.extracted_skills || [],
        skills: parsed.skills || parsed.extracted_skills || [],
        technologies: parsed.technologies || parsed.extracted_skills || [],
        certificationsMatchScore: parsed.certifications_match_score || 0,
        completenessMatchScore: parsed.completeness_score || 0,
        completenessScore: parsed.completeness_score || 0,
        matchedKeywords: parsed.matched_keywords || [],
        missingKeywords: parsed.missing_keywords || [],
        insights: parsed.insights || [],
        matchDetails: parsed.match_details || [],
        charts: parsed.charts || {},
        recommendations: parsed.recommendations || [],
      });
    });

    const inputData = JSON.stringify({
      file_path: filePath,
      job_description: jobDescription || "",
      job_skills: jobSkills || [],
      job_experience: jobExperience || "",
    });

    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
  });
};
