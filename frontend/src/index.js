import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import "./index.css";

// Configure automatic JWT Bearer token header for all axios requests
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token && token !== "mock-jwt-token") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);