import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorHeadline: {
      type: String,
      default: "",
    },
    authorPicture: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    media: {
      type: String,
      default: "",
    },
    attachedProject: {
      name: { type: String, default: "" },
      description: { type: String, default: "" },
      technologies: [{ type: String }],
      link: { type: String, default: "" },
    },
    attachedCertificate: {
      name: { type: String, default: "" },
      issuingOrganization: { type: String, default: "" },
      issueDate: { type: String, default: "" },
      credentialUrl: { type: String, default: "" },
      file: { type: String, default: "" },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: {
          type: String,
          required: true,
        },
        userPicture: {
          type: String,
          default: "",
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
