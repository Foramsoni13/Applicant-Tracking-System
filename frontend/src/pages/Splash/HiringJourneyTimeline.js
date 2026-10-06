import React, { useEffect, useState } from "react";
import "./HiringJourneyTimeline.css";

const STAGES = [
  {
    id: 1,
    icon: "💼",
    label: "HR Posts Job",
    detail: "New Opening: Senior AI Engineer",
    badge: "1. Job Published",
    color: "#2482c1",
  },
  {
    id: 2,
    icon: "📄",
    label: "Candidate Applies",
    detail: "Resume & Portfolio Submitted",
    badge: "2. Application Sent",
    color: "#68aad0",
  },
  {
    id: 3,
    icon: "⚡",
    label: "AI Match Score",
    detail: "98% Skills & Experience Match",
    badge: "3. ATS Ranked #1",
    color: "#8dbbd7",
  },
  {
    id: 4,
    icon: "🎉",
    label: "Interview Scheduled",
    detail: "Candidate Shortlisted for Round 1",
    badge: "4. Stage Completed",
    color: "#22c55e",
  },
];

function HiringJourneyTimeline({ onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    // Progress through each of the 4 stages smoothly
    const stageDuration = 750; // 750ms per stage = ~3 seconds total

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
          return prev;
        }
      });
    }, stageDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="ats-journey-wrapper">
      {/* Active Stage Showcase Card */}
      <div className="ats-journey-card-active">
        <div className="ats-journey-card-header">
          <div
            className="ats-journey-icon-wrap"
            style={{ backgroundColor: `${STAGES[currentStage].color}20`, borderColor: STAGES[currentStage].color }}
          >
            <span className="ats-journey-icon">{STAGES[currentStage].icon}</span>
          </div>
          <div className="ats-journey-text-wrap">
            <div className="ats-journey-badge-pill" style={{ color: STAGES[currentStage].color }}>
              {STAGES[currentStage].badge}
            </div>
            <h3 className="ats-journey-title">{STAGES[currentStage].label}</h3>
            <p className="ats-journey-detail">{STAGES[currentStage].detail}</p>
          </div>
        </div>
      </div>

      {/* 4-Step Stepper Timeline Track */}
      <div className="ats-stepper-track">
        {STAGES.map((st, idx) => {
          const isDone = idx < currentStage;
          const isActive = idx === currentStage;

          return (
            <React.Fragment key={st.id}>
              {/* Step Node */}
              <div className={`ats-stepper-node ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                <div className="ats-stepper-dot">
                  {isDone ? "✓" : st.id}
                </div>
                <span className="ats-stepper-label">{st.label}</span>
              </div>

              {/* Connecting Line between steps */}
              {idx < STAGES.length - 1 && (
                <div className={`ats-stepper-line ${idx < currentStage ? "filled" : ""}`}>
                  <div className="ats-stepper-line-fill" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default HiringJourneyTimeline;
