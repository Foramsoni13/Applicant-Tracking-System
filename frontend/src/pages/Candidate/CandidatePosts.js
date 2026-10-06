import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CandidateNavbar from "./CandidateNavbar";
import {
  FiSend,
  FiHeart,
  FiMessageSquare,
  FiShare2,
  FiArrowLeft,
  FiTag
} from "react-icons/fi";
import "./CandidatePosts.css";

function CandidatePosts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Comment Inputs Map (postId -> commentText)
  const [commentInputs, setCommentInputs] = useState({});
  // Expanded Comment Accordion Map (postId -> boolean)
  const [openComments, setOpenComments] = useState({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5002/api/posts");
      if (res.data && res.data.posts) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleToggleLike = async (postId) => {
    if (!user?._id) return;
    try {
      const res = await axios.post(`http://localhost:5002/api/posts/${postId}/like`, {
        userId: user._id,
      });
      if (res.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
        );
      }
    } catch (error) {
      console.error("Like toggle error:", error);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5002/api/posts/${postId}/comment`, {
        userId: user._id,
        text: text.trim(),
      });

      if (res.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p._id === postId ? { ...p, comments: res.data.comments } : p))
        );
        setCommentInputs({ ...commentInputs, [postId]: "" });
      }
    } catch (error) {
      console.error("Add comment error:", error);
    }
  };

  const toggleCommentsAccordion = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleShare = (postId) => {
    navigator.clipboard.writeText(window.location.href);
    alert("Post link copied to clipboard!");
  };

  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;
    if (mediaPath.startsWith("http://") || mediaPath.startsWith("https://")) return mediaPath;
    return `http://localhost:5002${mediaPath}`;
  };

  return (
    <div className="candidate-posts-page">
      <CandidateNavbar />

      <div className="posts-container animate-fade-in">
        {/* Page Header */}
        <div className="posts-header-blue">
          <div>
            <h1>Professional Posts Feed</h1>
            <p>Share your projects, achievements, certificates, and career updates.</p>
          </div>
          <button className="btn-secondary-blue" onClick={() => navigate("/candidate-dashboard")}>
            <FiArrowLeft /> Back to Dashboard
          </button>
        </div>

        {/* Posts Feed List */}
        {loading ? (
          <div className="skeleton-container">
            <div className="skeleton-card-blue"></div>
            <div className="skeleton-card-blue"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state-blue">
            <FiMessageSquare className="empty-icon" />
            <h3>No Posts Shared Yet</h3>
            <p>No community posts or updates available at this moment.</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => {
              const isLiked = Array.isArray(post.likes) && user?._id && post.likes.includes(user._id);
              const authorName = post.author?.name || post.authorName || "Candidate";
              const authorHeadline = post.author?.headline || post.authorHeadline || "Professional Candidate";
              const authorPic = post.author?.profilePicture || post.authorPicture;

              return (
                <div className="post-card-blue" key={post._id}>
                  {/* Card Header */}
                  <div className="post-card-header">
                    <div className="author-info">
                      <div className="author-avatar-circle">
                        {authorPic ? (
                          <img src={getMediaUrl(authorPic)} alt={authorName} />
                        ) : (
                          <span>{authorName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="author-details">
                        <h4>{authorName}</h4>
                        <span className="author-headline">{authorHeadline}</span>
                        <span className="post-date">
                          {new Date(post.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="post-content-body">
                    <p className="post-text">{post.content}</p>

                    {/* Media Preview */}
                    {post.media && (
                      <div className="post-media-box">
                        <img src={getMediaUrl(post.media)} alt="Post Attachment" />
                      </div>
                    )}

                    {/* Tags */}
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="post-tags-row">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="post-tag-pill">
                            <FiTag /> #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions Counter */}
                  <div className="post-stats-row">
                    <span>
                      <strong>{(post.likes || []).length}</strong> Likes
                    </span>
                    <span>
                      <strong>{(post.comments || []).length}</strong> Comments
                    </span>
                  </div>

                  {/* Interactive Action Bar */}
                  <div className="post-actions-bar">
                    <button
                      className={`action-bar-btn ${isLiked ? "liked" : ""}`}
                      onClick={() => handleToggleLike(post._id)}
                    >
                      <FiHeart className={isLiked ? "fill-heart" : ""} /> {isLiked ? "Liked" : "Like"}
                    </button>

                    <button
                      className="action-bar-btn"
                      onClick={() => toggleCommentsAccordion(post._id)}
                    >
                      <FiMessageSquare /> Comment
                    </button>

                    <button className="action-bar-btn" onClick={() => handleShare(post._id)}>
                      <FiShare2 /> Share
                    </button>
                  </div>

                  {/* Comments Accordion Section */}
                  {openComments[post._id] && (
                    <div className="comments-section-blue">
                      {/* Add Comment */}
                      <div className="add-comment-row">
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Write a professional comment..."
                          value={commentInputs[post._id] || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post._id);
                          }}
                        />
                        <button className="btn-primary-blue comment-submit-btn" onClick={() => handleAddComment(post._id)}>
                          <FiSend />
                        </button>
                      </div>

                      {/* Comments List */}
                      {Array.isArray(post.comments) && post.comments.length > 0 && (
                        <div className="comments-list">
                          {post.comments.map((c, idx) => (
                            <div className="comment-item-blue" key={idx}>
                              <div className="comment-user-avatar">
                                {c.userPicture ? (
                                  <img src={getMediaUrl(c.userPicture)} alt={c.userName} />
                                ) : (
                                  <span>{c.userName ? c.userName.charAt(0).toUpperCase() : "U"}</span>
                                )}
                              </div>
                              <div className="comment-content-box">
                                <div className="comment-user-header">
                                  <strong>{c.userName}</strong>
                                  <span>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <p>{c.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidatePosts;
