# Smart Recruitment Automation System – Resume Scanner Architecture & Workflow

This document explains the end-to-end architecture, workflow, and mathematical scoring logic of the **AI Resume Scanner & ATS Matching Engine** in the Smart Recruitment Automation System.

---

## 1. High-Level Resume Scanning Flow

```
+-----------------------------------------------------------------------+
|                       1. Candidate Upload                             |
|           Uploads Resume (PDF / DOCX) via Profile or Application      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       2. Document Storage                             |
|          Saved securely to backend `/uploads/resumes/` directory      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    3. Text Extraction & Parsing                       |
|   PDF/DOCX parsed via PyPDF2 / pdfplumber / python-docx / pdfminer    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    4. Entity & Feature Extraction                     |
|  Extracts: Candidate Name, Email, Phone, Skills, Education,          |
|  Experience, Projects, Certifications, and Languages via spaCy/NLTK   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    5. ATS Matching & Scoring Engine                   |
|  Compares Extracted Resume Features against Job Description (JD)      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     6. Granular Sub-Score Breakdown                   |
|   Calculates: Skills Match, Education Match, Experience Match,        |
|   Project Match, Keyword Match (TF-IDF Similarity), & Overall ATS %  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                  7. Persistence & HR Dashboard Display                |
|  Results stored in MongoDB Application Schema & rendered on HR UI     |
+-----------------------------------------------------------------------+
```

---

## 2. Detailed Step-by-Step Pipeline

### Step 1: Candidate File Upload
- Candidate submits a resume file (`.pdf` or `.docx`) under **5 MB**.
- File is validated by Multer middleware on the Node.js Express server.

### Step 2: Storage & File Tracking
- File is saved in `uploads/resumes/` with a unique timestamped filename.
- File reference and metadata (file size, mimetype, upload timestamp) are indexed in the `Resume` MongoDB collection.

### Step 3: Text Extraction
- The Python ATS service reads the document binary.
- Extractors strip layout noise, headers/footers, and convert text into standardized UTF-8 text strings.

### Step 4: NLP Feature Extraction (spaCy & NLTK)
- **Name & Contact Extraction**: Regex + Named Entity Recognition (NER) identifies candidate name, email address, phone number, and location.
- **Skills Extraction**: Tokenization and dictionary matching against thousands of standard technical and soft skills.
- **Education Extraction**: Identifies degrees (B.Tech, B.S., M.S., Ph.D., MBA), institutions, and graduation years.
- **Experience Extraction**: Computes total years of professional experience and job titles.
- **Projects & Certifications**: Parses project headers, descriptions, and verified certification keywords.

### Step 5: Job Description Comparison & TF-IDF Vectorization
- The Job Description (title, required skills, experience requirement, description) is vectorized alongside the candidate text using **TF-IDF (Term Frequency - Inverse Document Frequency)** and **Cosine Similarity**.

---

## 3. ATS Scoring Breakdown Algorithm

The ATS engine computes an **Overall Match Score (%)** composed of five weighted sub-scores:

| Component | Weight | Description |
| :--- | :--- | :--- |
| **Skills Match** | **40%** | Ratio of required job skills present in candidate resume |
| **Experience Match**| **25%** | Alignment between required experience level and extracted candidate tenure |
| **Education Match** | **15%** | Matching qualification degree and academic field |
| **Project Match**   | **10%** | Relevance of candidate projects to job requirements |
| **Keyword Match**   | **10%** | TF-IDF Cosine Similarity of overall resume text vs. job text |

### Score Calculation Formula:
$$\text{Overall ATS Score} = (0.40 \times \text{Skills Score}) + (0.25 \times \text{Experience Score}) + (0.15 \times \text{Education Score}) + (0.10 \times \text{Project Score}) + (0.10 \times \text{Keyword Score})$$

---

## 4. HR Dashboard Display & Feedback

- **Visual Match Indicators**: Progress bars rendered in clean enterprise blue gradients.
- **Missing Skills Rationale**: HR sees exact missing skills (e.g., *Missing: Docker, Kubernetes, GraphQL*) to understand why candidate scored lower.
- **Instant Filtering**: HR can sort and filter candidates by Match Score %, status, or specific skill tags.
