import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { createRequire } from "module";

// ==========================================
// STOP WORDS LIST
// ==========================================

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","it","as","was","were","be","been","being","have","has",
  "had","do","does","did","will","would","shall","should","may","might",
  "can","could","am","are","this","that","these","those","i","me","my",
  "we","our","you","your","he","him","his","she","her","they","them",
  "their","its","not","no","so","if","then","than","too","very","just",
  "about","above","after","again","all","also","any","because","before",
  "between","both","during","each","few","further","here","how","into",
  "more","most","other","out","over","own","same","some","such","through",
  "under","until","up","what","when","where","which","while","who","why",
  "the","etc","eg","ie","vs"
]);


// ==========================================
// SKILL ALIAS / NORMALIZATION MAP
// ==========================================

const SKILL_ALIASES = {
  "js": "JavaScript",
  "javascript": "JavaScript",
  "react": "React.js",
  "reactjs": "React.js",
  "react.js": "React.js",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "express": "Express.js",
  "expressjs": "Express.js",
  "express.js": "Express.js",
  "next": "Next.js",
  "nextjs": "Next.js",
  "next.js": "Next.js",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "vue.js": "Vue.js",
  "angular": "Angular",
  "angularjs": "Angular",
  "html": "HTML5",
  "html5": "HTML5",
  "css": "CSS3",
  "css3": "CSS3",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "python": "Python",
  "python3": "Python",
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ai": "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  "deep learning": "Deep Learning",
  "nlp": "NLP",
  "natural language processing": "NLP",
  "rest": "REST API",
  "rest api": "REST API",
  "restful": "REST API",
  "restful api": "REST API",
  "graphql": "GraphQL",
  "docker": "Docker",
  "k8s": "Kubernetes",
  "kubernetes": "Kubernetes",
  "git": "Git",
  "github": "GitHub",
  "gitlab": "GitLab",
  "aws": "AWS",
  "amazon web services": "AWS",
  "azure": "Azure",
  "gcp": "GCP",
  "google cloud": "GCP",
  "firebase": "Firebase",
  "firestore": "Firestore",
  "sql": "SQL",
  "mysql": "MySQL",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "sqlite": "SQLite",
  "redis": "Redis",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "sklearn": "Scikit-learn",
  "scikit-learn": "Scikit-learn",
  "scikit learn": "Scikit-learn",
  "tensorflow": "TensorFlow",
  "pytorch": "PyTorch",
  "keras": "Keras",
  "matplotlib": "Matplotlib",
  "seaborn": "Seaborn",
  "data science": "Data Science",
  "data analytics": "Data Analytics",
  "data analysis": "Data Analytics",
  "java": "Java",
  "c++": "C++",
  "cpp": "C++",
  "c#": "C#",
  "csharp": "C#",
  "php": "PHP",
  "ruby": "Ruby",
  "go": "Go",
  "golang": "Go",
  "swift": "Swift",
  "kotlin": "Kotlin",
  "tailwind": "TailwindCSS",
  "tailwindcss": "TailwindCSS",
  "bootstrap": "Bootstrap",
  "sass": "SASS",
  "scss": "SCSS",
  "agile": "Agile",
  "scrum": "Scrum",
  "flutter": "Flutter",
  "react native": "React Native",
  "postman": "Postman",
  "linux": "Linux",
  "jwt": "JWT",
  "oauth": "OAuth",
  "ci/cd": "CI/CD",
  "jenkins": "Jenkins",
  "microservices": "Microservices",
  "spark": "Apache Spark",
  "apache spark": "Apache Spark",
  "kafka": "Apache Kafka",
  "hadoop": "Hadoop",
  "spring boot": "Spring Boot",
  "spring": "Spring",
  "selenium": "Selenium",
  "jupyter": "Jupyter",
  "opencv": "OpenCV",
  "redux": "Redux",
  "socket.io": "Socket.io",
  "websocket": "WebSocket",
  "dsa": "DSA",
  "data structures": "Data Structures",
  "algorithms": "Algorithms",
  "oop": "OOP",
  "typescript": "TypeScript",
  "svelte": "Svelte",
  "vite": "Vite",
  "webpack": "Webpack",
};

// ==========================================
// KNOWN SKILLS DATABASE
// ==========================================

const KNOWN_SKILLS = [
  // Programming Languages
  "javascript","typescript","python","java","c","c++","c#","ruby","php",
  "swift","kotlin","go","golang","rust","scala","perl","r","matlab",
  "objective-c","dart","lua","haskell","elixir","clojure","groovy",
  "visual basic","vb.net","assembly","fortran","cobol","shell","bash",
  "powershell","sql","nosql","plsql",

  // Frontend
  "react","reactjs","react.js","angular","angularjs","vue","vuejs","vue.js",
  "svelte","nextjs","next.js","nuxtjs","nuxt.js","gatsby","html","html5",
  "css","css3","sass","scss","less","tailwind","tailwindcss","bootstrap",
  "material ui","mui","chakra ui","styled-components","jquery","webpack",
  "vite","babel","redux","mobx","zustand","context api",

  // Backend
  "node","nodejs","node.js","express","expressjs","express.js","django",
  "flask","fastapi","spring","spring boot","laravel","rails","ruby on rails",
  "asp.net",".net","nest","nestjs","nest.js","koa","hapi","fastify",
  "gin","fiber","phoenix","sinatra",

  // Database
  "mongodb","mongoose","mysql","postgresql","postgres","sqlite","redis",
  "elasticsearch","cassandra","dynamodb","mariadb","oracle","mssql",
  "sql server","firebase","firestore","supabase","prisma","sequelize",
  "typeorm","knex",

  // Cloud & DevOps
  "aws","amazon web services","azure","gcp","google cloud","heroku",
  "vercel","netlify","digitalocean","docker","kubernetes","k8s",
  "jenkins","ci/cd","github actions","gitlab ci","terraform","ansible",
  "nginx","apache","linux","ubuntu","centos",

  // Mobile
  "react native","flutter","ionic","xamarin","android","ios","swiftui",
  "jetpack compose","cordova","capacitor",

  // AI/ML
  "machine learning","deep learning","artificial intelligence","ai","ml",
  "tensorflow","pytorch","keras","scikit-learn","sklearn","opencv",
  "nlp","natural language processing","computer vision","neural networks",
  "pandas","numpy","scipy","matplotlib","seaborn","jupyter",
  "data science","data analysis","data analytics","data engineering","big data",
  "hadoop","spark","apache spark","kafka","airflow","pyspark",

  // Tools & Others
  "git","github","gitlab","bitbucket","jira","confluence","trello",
  "slack","figma","sketch","adobe xd","photoshop","illustrator",
  "postman","swagger","rest","restful","rest api","graphql","api","microservices",
  "agile","scrum","kanban","tdd","bdd","unit testing","jest","mocha",
  "chai","cypress","selenium","playwright","puppeteer",
  "socket.io","websocket","grpc","rabbitmq","celery",
  "jwt","oauth","authentication","authorization","security",
  "responsive design","cross-browser","accessibility","seo",
  "performance optimization","caching","load balancing",
  "data structures","algorithms","oop","design patterns",
  "system design","architecture","dsa"
];


// ==========================================
// NORMALIZE SKILL
// ==========================================

const normalizeSkill = (skill) => {
  const key = skill.toLowerCase().trim();
  return SKILL_ALIASES[key] || skill.trim();
};


// ==========================================
// EXTRACT TEXT FROM FILE
// ==========================================

const extractTextFromFile = async (filePath) => {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error("Resume file not found");
  }

  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".pdf") {
    // Try pdf-parse via require (CJS compat)
    try {
      const require = createRequire(import.meta.url);
      const pdfParse = require("pdf-parse");
      const dataBuffer = fs.readFileSync(absolutePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData?.text || "";
      if (text.trim()) return text;
    } catch (err) {
      // pdf-parse failed, will try mammoth or throw
    }

    // Fallback: throw so Python handles PDF parsing (Python pipeline is primary)
    throw new Error(
      "PDF parsing failed in Node.js. The Python service will handle this file."
    );
  }

  if (ext === ".docx" || ext === ".doc") {
    const result = await mammoth.extractRawText({ path: absolutePath });
    const text = result?.value || "";
    if (!text.trim()) {
      throw new Error("DOCX file appears to be empty or corrupted.");
    }
    return text;
  }

  throw new Error("Unsupported file format. Only PDF and DOCX are supported.");
};


// ==========================================
// CLEAN TEXT
// ==========================================

const cleanText = (text) => {
  if (!text) return "";

  let cleaned = text
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w\s@.+#\-\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return cleaned;
};


// ==========================================
// REMOVE STOP WORDS
// ==========================================

const removeStopWords = (text) => {
  if (!text) return "";

  return text
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    .join(" ");
};


// ==========================================
// EXTRACT EMAIL
// ==========================================

const extractEmail = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : "";
};


// ==========================================
// EXTRACT PHONE
// ==========================================

const extractPhone = (text) => {
  const phonePatterns = [
    /(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g,
    /(?:\+?\d{1,3}[\s\-]?)?\d{10}/g,
    /(?:\+?\d{1,3}[\s\-]?)?\d{5}[\s\-]?\d{5}/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      return matches[0].trim();
    }
  }

  return "";
};


// ==========================================
// EXTRACT NAME (First meaningful line)
// ==========================================

const extractName = (rawText) => {
  if (!rawText) return "";

  const lines = rawText
    .split(/[\r\n]+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const line of lines.slice(0, 5)) {
    const cleaned = line.replace(/[^a-zA-Z\s.]/g, "").trim();

    if (
      cleaned.length >= 3 &&
      cleaned.length <= 60 &&
      !cleaned.includes("@") &&
      !/^\d/.test(cleaned) &&
      !/resume|curriculum|vitae|cv|objective|summary|profile|phone|email|address|contact/i.test(cleaned)
    ) {
      const words = cleaned.split(/\s+/).filter(w => w.length > 1);
      if (words.length >= 2 && words.length <= 5) {
        return words
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }

  return "";
};


// ==========================================
// EXTRACT SECTION TEXT
// ==========================================

const extractSection = (text, sectionHeaders) => {
  const lines = text.split(/[\r\n]+/);
  let capturing = false;
  let result = [];

  const allSectionHeaders = [
    "education", "experience", "work experience", "professional experience",
    "employment", "skills", "technical skills", "core skills", "key skills",
    "projects", "certifications", "certificates", "awards", "achievements",
    "publications", "references", "summary", "objective", "profile", "about",
    "personal", "contact", "languages", "interests", "hobbies", "activities",
    "volunteer", "training", "courses", "qualifications", "technologies"
  ];

  for (const line of lines) {
    const trimmedLower = line.trim().toLowerCase();

    const isTargetHeader = sectionHeaders.some(h =>
      trimmedLower.includes(h) &&
      trimmedLower.length < 70
    );

    const isOtherHeader = !isTargetHeader && allSectionHeaders.some(h =>
      trimmedLower.includes(h) &&
      trimmedLower.length < 70 &&
      (trimmedLower.startsWith(h) || trimmedLower.endsWith(h) || trimmedLower === h || trimmedLower === h + ":")
    );

    if (isTargetHeader) {
      capturing = true;
      continue;
    }

    if (capturing && isOtherHeader) {
      break;
    }

    if (capturing && line.trim().length > 0) {
      result.push(line.trim());
    }
  }

  return result.join("\n").trim();
};


// ==========================================
// EXTRACT SKILLS
// ==========================================

const extractSkills = (text) => {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const foundSkills = new Map(); // normalized -> display name

  // Sort skills by length (longest first) for multi-word priority
  const sortedSkills = [...KNOWN_SKILLS].sort((a, b) => b.length - a.length);

  for (const skill of sortedSkills) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let regex;
    // Handle skills ending with special chars
    if (/[+#.]$/.test(skill)) {
      regex = new RegExp(`(?<!\\w)${escapedSkill}(?!\\w)`, "i");
    } else {
      regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
    }

    if (regex.test(lowerText)) {
      const normalized = normalizeSkill(skill);
      const normLower = normalized.toLowerCase();
      if (!foundSkills.has(normLower)) {
        foundSkills.set(normLower, normalized);
      }
    }
  }

  return [...foundSkills.values()].sort();
};


// ==========================================
// EXTRACT TECHNOLOGIES
// ==========================================

const extractTechnologies = (text) => {
  const techKeywords = [
    "react","angular","vue","node","express","mongodb","mysql","postgresql",
    "redis","docker","kubernetes","aws","azure","gcp","python","java",
    "javascript","typescript","html","css","git","github","firebase",
    "graphql","rest","django","flask","spring","tensorflow","pytorch",
    "next.js","nuxt.js","tailwind","bootstrap","sass","webpack","vite",
    "flutter","react native","swift","kotlin","go","rust","c++","c#",
    ".net","php","ruby","laravel","rails","pandas","numpy","scikit-learn",
    "machine learning","data science","data analytics","fastapi"
  ];

  const lowerText = text.toLowerCase();
  const found = new Set();

  for (const tech of techKeywords) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lowerText)) {
      found.add(normalizeSkill(tech));
    }
  }

  return [...found];
};


// ==========================================
// EXTRACT LOCATION
// ==========================================

const extractLocation = (text) => {
  if (!text) return "";

  const locations = [
    "ahmedabad","mumbai","delhi","bangalore","bengaluru","hyderabad",
    "chennai","kolkata","pune","jaipur","surat","lucknow","kanpur",
    "nagpur","indore","thane","bhopal","visakhapatnam","vadodara",
    "gurgaon","gurugram","noida","chandigarh","coimbatore","kochi",
    "patna","rajkot","gandhinagar","faridabad","ghaziabad",
    "new york","san francisco","los angeles","chicago","boston",
    "seattle","austin","denver","london","toronto","berlin","singapore",
    "dubai","remote","hybrid",
    "gujarat","maharashtra","karnataka","telangana","tamil nadu",
    "west bengal","rajasthan","uttar pradesh","madhya pradesh","kerala",
    "california","texas","washington","new jersey","massachusetts",
    "india","usa","uk","canada","australia","germany"
  ];

  const lowerText = text.toLowerCase();

  for (const loc of locations) {
    if (lowerText.includes(loc)) {
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }

  return "";
};


// ==========================================
// MAIN PARSE RESUME FUNCTION
// ==========================================
// STRUCTURED EXTRACTION HELPERS FOR NODE PARSER
// ==========================================

const extractEducationStructuredNode = (text) => {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();
  let current = {};

  for (const line of lines) {
    if (line.length < 120) {
      if (/b\.?tech|m\.?tech|bca|mca|b\.?sc|m\.?sc|b\.?e|m\.?e|b\.?com|m\.?com|ba|ma|phd|diploma|bachelor|master/i.test(line) && !current.degree) {
        current.degree = line;
        continue;
      }
      if (/university|college|institute|school|academy/i.test(line) && !current.institution) {
        current.institution = line;
        continue;
      }
      const cgpaMatch = line.match(/(\d{1,2}(?:\.\d+)?(?:\s*[\/%]\s*10)?\s*(?:cgpa|gpa|%)?)/i);
      if (cgpaMatch && /cgpa|gpa|%/i.test(line) && !current.cgpa) {
        current.cgpa = cgpaMatch[0];
      }
      const yearMatch = line.match(/(20\d{2}|19\d{2})/);
      if (yearMatch && !current.year) {
        current.year = yearMatch[1];
      }
    }
    if (Object.keys(current).length >= 2 || (Object.keys(current).length > 0 && line.length > 100)) {
      const deg = current.degree || "Degree";
      const inst = current.institution || "";
      const yr = current.year || "";
      const cgp = current.cgpa || "";
      const key = `${deg.toLowerCase().trim()}|${inst.toLowerCase().trim()}`;
      if (!seen.has(key) && (deg || inst)) {
        seen.add(key);
        results.push({ degree: deg, institution: inst, year: yr, cgpa: cgp });
      }
      current = {};
    }
  }
  if (Object.keys(current).length > 0) {
    const deg = current.degree || "Degree";
    const inst = current.institution || "";
    const yr = current.year || "";
    const cgp = current.cgpa || "";
    const key = `${deg.toLowerCase().trim()}|${inst.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ degree: deg, institution: inst, year: yr, cgpa: cgp });
    }
  }
  if (results.length === 0 && lines.length > 0) {
    results.push({ degree: lines[0], institution: lines[1] || "", year: "", cgpa: "" });
  }
  return results;
};

const extractExperienceStructuredNode = (text) => {
  if (!text || !text.trim()) return [];
  if (text.toLowerCase().slice(0, 200).includes("fresher") && text.trim().length < 100) {
    return [{ title: "Fresher", company: "", duration: "", description: "Fresher" }];
  }
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();
  let current = null;

  for (const line of lines) {
    const dateMatch = line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*[-–\to]+\s*(?:present|current|\w+ \d{4})/i) || line.match(/(20\d{2}|19\d{2})\s*[-–\to]+\s*(20\d{2}|19\d{2}|present|current)/i);
    if (dateMatch) {
      if (current) {
        const key = `${current.title.toLowerCase().trim()}|${current.company.toLowerCase().trim()}`;
        if (!seen.has(key) && (current.title || current.company)) {
          seen.add(key);
          results.push(current);
        }
      }
      current = { title: "Role", company: "Company", duration: dateMatch[0], description: "" };
    } else if (current) {
      if (current.title === "Role" && line.length < 70 && !/^[•\-*]/.test(line)) {
        current.title = line;
      } else if (current.company === "Company" && line.length < 70 && !/^[•\-*]/.test(line)) {
        current.company = line;
      } else {
        current.description = current.description ? `${current.description} ${line}` : line;
      }
    } else {
      current = { title: line.length < 70 ? line : "Role", company: "", duration: "", description: line.length >= 70 ? line : "" };
    }
  }
  if (current) {
    const key = `${current.title.toLowerCase().trim()}|${current.company.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(current);
    }
  }
  return results.map(item => ({
    title: item.title === "Role" ? "Professional Experience" : item.title,
    company: item.company === "Company" ? "" : item.company,
    duration: item.duration || "",
    description: item.description || ""
  }));
};

const extractProjectsStructuredNode = (text, skills = []) => {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();
  let current = null;

  for (const line of lines) {
    if (line.length < 70 && !/^[•\-*]/.test(line) && !line.endsWith(":")) {
      if (current) {
        const key = current.name.toLowerCase().trim();
        if (!seen.has(key) && current.name) {
          seen.add(key);
          results.push(current);
        }
      }
      current = { name: line, description: "", technologies: [] };
    } else {
      if (!current) {
        current = { name: "Project", description: line, technologies: [] };
      } else {
        current.description = current.description ? `${current.description} ${line}` : line;
      }
      for (const skill of skills) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(line) && !current.technologies.includes(skill)) {
          current.technologies.push(skill);
        }
      }
    }
  }
  if (current) {
    const key = current.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(current);
    }
  }
  return results;
};

const extractCertificationsStructuredNode = (text) => {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).map(l => l.replace(/^[•\-*\s]+/, "").trim()).filter(l => l.length > 3);
  const seen = new Set();
  const results = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (line.length < 120 && !seen.has(lower)) {
      seen.add(lower);
      results.push(line);
    }
  }
  return results.slice(0, 15);
};

const extractLanguagesStructuredNode = (text) => {
  if (!text || !text.trim()) return [];
  const known = ["english", "hindi", "gujarati", "marathi", "spanish", "french", "german", "mandarin", "chinese", "japanese", "korean", "russian", "arabic", "portuguese", "italian", "bengali", "tamil", "telugu", "kannada", "malayalam", "punjabi", "urdu"];
  const lower = text.toLowerCase();
  const found = new Set();
  for (const lang of known) {
    if (new RegExp(`\\b${lang}\\b`, "i").test(lower)) {
      found.add(lang.charAt(0).toUpperCase() + lang.slice(1));
    }
  }
  return [...found].sort();
};

const extractAchievementsStructuredNode = (text) => {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).map(l => l.replace(/^[•\-*\s]+/, "").trim()).filter(l => l.length > 5);
  const seen = new Set();
  const results = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (line.length < 150 && !seen.has(lower)) {
      seen.add(lower);
      results.push(line);
    }
  }
  return results.slice(0, 10);
};

// ==========================================
// MAIN PARSE RESUME FUNCTION
// ==========================================

const parseResume = async (filePath) => {
  let rawText = "";

  try {
    rawText = await extractTextFromFile(filePath);
  } catch (err) {
    console.log("JS resume parser note:", err.message);
    return {
      extractedText: "",
      rawText: "",
      candidateName: "",
      email: "",
      phone: "",
      location: "",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
      extractedSkills: [],
      languages: [],
      achievements: [],
      technologies: [],
      parseError: err.message,
    };
  }

  if (!rawText || rawText.trim().length === 0) {
    return {
      extractedText: "",
      rawText: "",
      candidateName: "",
      email: "",
      phone: "",
      location: "",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
      extractedSkills: [],
      languages: [],
      achievements: [],
      technologies: [],
      parseError: "Could not extract text from resume",
    };
  }

  const cleanedText = cleanText(rawText);
  const processedText = removeStopWords(cleanedText);

  const candidateName = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const location = extractLocation(rawText);

  const educationText = extractSection(rawText, [
    "education", "academic", "qualification", "degree", "university", "college"
  ]);

  const experienceText = extractSection(rawText, [
    "experience", "work experience", "professional experience",
    "employment", "work history", "career"
  ]);

  const projectsText = extractSection(rawText, [
    "projects", "project", "personal projects", "academic projects"
  ]);

  const certsText = extractSection(rawText, [
    "certifications", "certificates", "certification", "licensed",
    "professional certifications"
  ]);

  const achieveText = extractSection(rawText, [
    "awards", "achievements", "accomplishments", "honors"
  ]);

  const langText = extractSection(rawText, [
    "languages", "language"
  ]);

  const extractedSkills = extractSkills(rawText);
  const technologies = extractTechnologies(rawText);

  const education = extractEducationStructuredNode(educationText);
  const experience = extractExperienceStructuredNode(experienceText);
  const projects = extractProjectsStructuredNode(projectsText, extractedSkills);
  const certifications = extractCertificationsStructuredNode(certsText);
  const languages = extractLanguagesStructuredNode(langText || rawText);
  const achievements = extractAchievementsStructuredNode(achieveText);

  return {
    extractedText: processedText,
    rawText: rawText,
    candidateName,
    email,
    phone,
    location,
    education,
    experience,
    projects,
    certifications,
    skills: extractedSkills,
    extractedSkills,
    languages,
    achievements,
    technologies,
  };
};


export {
  parseResume,
  cleanText,
  removeStopWords,
  extractSkills,
  extractTextFromFile,
  normalizeSkill,
};
