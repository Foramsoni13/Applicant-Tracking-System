import React from "react";
import "./ResumeScannerAnimation.css";

function ResumeScannerAnimation() {
  return (
    <div className="ats-resume-scanner-container">
      {/* Background Soft Glow Aura */}
      <div className="ats-scanner-glow-aura" />

      {/* Floating Skill Chips */}
      <div className="ats-floating-chip chip-1">
        <span className="chip-dot" />
        <span>AI / ML Match</span>
      </div>
      <div className="ats-floating-chip chip-2">
        <span className="chip-dot" />
        <span>Full-Stack</span>
      </div>
      <div className="ats-floating-chip chip-3">
        <span className="chip-dot" />
        <span>Experience: 5+ Yrs</span>
      </div>

      {/* Floating Verification Badge (Top Right) */}
      <div className="ats-scanner-badge badge-match">
        <div className="badge-icon-wrap check-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="badge-text-group">
          <span className="badge-title">98% AI Score</span>
          <span className="badge-subtitle">Top Candidate</span>
        </div>
      </div>

      {/* Floating Magnifier / Verified Badge (Bottom Left) */}
      <div className="ats-scanner-badge badge-verify">
        <div className="badge-icon-wrap search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="badge-text-group">
          <span className="badge-title">Skills Verified</span>
          <span className="badge-subtitle">14 / 14 Criteria</span>
        </div>
      </div>

      {/* Central 3D Vector Resume Document */}
      <div className="ats-resume-sheet">
        {/* Animated AI Scanning Laser Bar */}
        <div className="ats-scan-laser-line">
          <div className="laser-glow-core" />
          <div className="laser-sensor-dot" />
        </div>

        {/* Resume Header Area */}
        <div className="ats-resume-header">
          <div className="ats-resume-avatar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2482c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="ats-resume-header-lines">
            <div className="skeleton-line line-title" />
            <div className="skeleton-line line-sub" />
          </div>
        </div>

        {/* Resume Divider */}
        <div className="ats-resume-divider" />

        {/* Resume Body Content Skeleton Lines */}
        <div className="ats-resume-body">
          <div className="skeleton-section-label">EXPERIENCE & SKILLS</div>
          <div className="skeleton-line line-long" />
          <div className="skeleton-line line-med" />
          <div className="skeleton-line line-short" />

          {/* Mini Skill Progress Track */}
          <div className="ats-mini-skill-row">
            <div className="skeleton-line line-tiny" />
            <div className="ats-mini-skill-bar">
              <div className="ats-mini-skill-fill" style={{ width: "92%" }} />
            </div>
          </div>
          <div className="ats-mini-skill-row">
            <div className="skeleton-line line-tiny-2" />
            <div className="ats-mini-skill-bar">
              <div className="ats-mini-skill-fill" style={{ width: "85%" }} />
            </div>
          </div>

          <div className="skeleton-section-label" style={{ marginTop: "12px" }}>
            ATS EVALUATION
          </div>
          <div className="skeleton-line line-long highlight-blue" />
          <div className="skeleton-line line-med highlight-green" />
        </div>
      </div>
    </div>
  );
}

export default ResumeScannerAnimation;
