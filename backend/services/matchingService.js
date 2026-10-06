// ==========================================
// TF-IDF + COSINE SIMILARITY MATCHING SERVICE
// No external NLP libraries - pure implementation
// ==========================================


// ==========================================
// STOP WORDS
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
  "etc","eg","ie","vs","able","need","must","using","used","use","work",
  "working","works","well","good","new","year","years","required",
  "requirements","preferred","strong","excellent","looking","role","job",
  "position","candidate","apply","company","team","include","including",
  "including","responsibility","responsibilities"
]);


// ==========================================
// TOKENIZE TEXT
// ==========================================

const tokenize = (text) => {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s#.+\-]/g, " ")
    .split(/\s+/)
    .filter(word =>
      word.length > 1 &&
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word)
    );
};


// ==========================================
// CALCULATE TERM FREQUENCY (TF)
// ==========================================

const calculateTF = (tokens) => {
  const tf = {};
  const totalTokens = tokens.length;

  if (totalTokens === 0) return tf;

  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }

  // Normalize by total number of tokens
  for (const token in tf) {
    tf[token] = tf[token] / totalTokens;
  }

  return tf;
};


// ==========================================
// CALCULATE INVERSE DOCUMENT FREQUENCY (IDF)
// ==========================================

const calculateIDF = (documents) => {
  const idf = {};
  const totalDocs = documents.length;
  const docFreq = {};

  // Count how many documents contain each term
  for (const doc of documents) {
    const uniqueTokens = new Set(doc);
    for (const token of uniqueTokens) {
      docFreq[token] = (docFreq[token] || 0) + 1;
    }
  }

  // Calculate IDF with smoothing
  for (const token in docFreq) {
    idf[token] = Math.log((totalDocs + 1) / (docFreq[token] + 1)) + 1;
  }

  return idf;
};


// ==========================================
// CALCULATE TF-IDF VECTOR
// ==========================================

const calculateTFIDF = (tf, idf) => {
  const tfidf = {};

  for (const token in tf) {
    tfidf[token] = tf[token] * (idf[token] || 1);
  }

  return tfidf;
};


// ==========================================
// COSINE SIMILARITY
// ==========================================

const cosineSimilarity = (vectorA, vectorB) => {
  // Get all unique terms from both vectors
  const allTerms = new Set([
    ...Object.keys(vectorA),
    ...Object.keys(vectorB)
  ]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of allTerms) {
    const a = vectorA[term] || 0;
    const b = vectorB[term] || 0;

    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};


// ==========================================
// SKILL MATCHING
// ==========================================

const matchSkills = (candidateSkills, jobSkills) => {
  // Normalize both arrays to lowercase for comparison
  const candidateNormalized = candidateSkills.map(s =>
    s.toLowerCase().trim()
  );

  const jobNormalized = jobSkills.map(s =>
    s.toLowerCase().trim()
  );

  const matched = [];
  const missing = [];

  for (const jobSkill of jobNormalized) {
    const isMatched = candidateNormalized.some(cs => {
      // Exact match
      if (cs === jobSkill) return true;

      // Partial match (one contains the other)
      if (cs.includes(jobSkill) || jobSkill.includes(cs)) return true;

      // Handle common aliases
      const aliases = {
        "js": "javascript",
        "ts": "typescript",
        "react": "reactjs",
        "reactjs": "react",
        "react.js": "react",
        "node": "nodejs",
        "nodejs": "node",
        "node.js": "node",
        "express": "expressjs",
        "expressjs": "express",
        "express.js": "express",
        "next": "nextjs",
        "nextjs": "next",
        "next.js": "next",
        "mongo": "mongodb",
        "mongodb": "mongo",
        "postgres": "postgresql",
        "postgresql": "postgres",
        "vue": "vuejs",
        "vuejs": "vue",
        "vue.js": "vue",
        "angular": "angularjs",
        "angularjs": "angular",
        "c#": "csharp",
        "csharp": "c#",
        "c++": "cpp",
        "cpp": "c++",
      };

      const csAlias = aliases[cs] || cs;
      const jobAlias = aliases[jobSkill] || jobSkill;

      return csAlias === jobSkill || cs === jobAlias;
    });

    // Find original case version of job skill
    const originalSkill = jobSkills.find(
      s => s.toLowerCase().trim() === jobSkill
    ) || jobSkill;

    if (isMatched) {
      matched.push(originalSkill);
    } else {
      missing.push(originalSkill);
    }
  }

  return { matched, missing };
};


// ==========================================
// MAIN MATCHING FUNCTION
// ==========================================

const calculateMatchScore = (resumeText, jobDescription, candidateSkills = [], jobSkills = []) => {

  // Tokenize both documents
  const resumeTokens = tokenize(resumeText);
  const jobTokens = tokenize(jobDescription);

  if (resumeTokens.length === 0 || jobTokens.length === 0) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: jobSkills,
      status: "Rejected",
      rejectionReason: "Unable to process resume or job description text",
    };
  }

  // Calculate TF for both documents
  const resumeTF = calculateTF(resumeTokens);
  const jobTF = calculateTF(jobTokens);

  // Calculate IDF across both documents
  const idf = calculateIDF([resumeTokens, jobTokens]);

  // Calculate TF-IDF vectors
  const resumeVector = calculateTFIDF(resumeTF, idf);
  const jobVector = calculateTFIDF(jobTF, idf);

  // Calculate cosine similarity
  let textSimilarity = cosineSimilarity(resumeVector, jobVector);

  // Skill matching
  const { matched, missing } = matchSkills(candidateSkills, jobSkills);

  // Calculate skill match ratio
  const skillScore = jobSkills.length > 0
    ? (matched.length / jobSkills.length)
    : 0;

  // Combined score: 60% text similarity + 40% skill match
  // This gives a balanced weight between overall resume relevance and specific skill matching
  const combinedScore = (textSimilarity * 0.6) + (skillScore * 0.4);

  // Convert to percentage (0-100)
  const matchScore = Math.round(combinedScore * 100);

  // Decision logic
  const status = matchScore >= 60 ? "Accepted" : "Rejected";
  const resumeStatus = matchScore >= 60 ? "Accepted" : "Rejected";

  let rejectionReason = "";

  if (matchScore < 60) {
    const reasons = [];

    if (missing.length > 0) {
      reasons.push(`Missing required skills: ${missing.join(", ")}`);
    }

    if (textSimilarity < 0.3) {
      reasons.push("Resume content does not align well with job requirements");
    }

    if (matchScore < 30) {
      reasons.push("Very low overall match with job description");
    }

    rejectionReason = reasons.join(". ") || "Match score below threshold (60%)";
  }

  return {
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    status,
    resumeStatus,
    rejectionReason,
    textSimilarity: Math.round(textSimilarity * 100),
    skillMatchRate: Math.round(skillScore * 100),
  };
};


export {
  calculateMatchScore,
  tokenize,
  calculateTF,
  calculateIDF,
  calculateTFIDF,
  cosineSimilarity,
  matchSkills,
};
