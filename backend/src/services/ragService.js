const axios = require("axios");

class RAGService {
  constructor() {
    this.spaceUrl = process.env.HF_SPACE_URL;
    this.token = process.env.HF_API_TOKEN;

    if (!this.spaceUrl) {
      console.warn("⚠️ HF_SPACE_URL not configured - RAG queries will fail");
    }
  }

  async query(userQuery, opts = {}) {
    if (!userQuery || userQuery.trim().length === 0) {
      return {
        answer: "Please provide a question.",
        sources: [],
        confidence: "low"
      };
    }

    if (!this.spaceUrl) {
      return {
        answer: "Legal AI service is not configured properly.",
        sources: [],
        confidence: "low"
      };
    }

    const payload = {
      question: userQuery,
      session_id: opts.sessionId || "default"
    };

    const headers = {
      "Content-Type": "application/json"
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      console.log("🌐 Calling Hugging Face Space...");
      const response = await axios.post(
        this.spaceUrl,
        payload,
        {
          headers,
          timeout: 60000
        }
      );

      return {
        answer: response.data.answer,
        sources: response.data.sources || [],
        session_id: response.data.session_id,
        confidence:
          response.data.sources && response.data.sources.length > 0
            ? "high"
            : "medium"
      };

    } catch (error) {
      console.error(
        "❌ HF Space Error:",
        error.response?.data || error.message
      );

      return {
        answer: "Legal AI service is currently unavailable.",
        sources: [],
        confidence: "low"
      };
    }
  }

  async initialize() {
    console.log("🚀 RAG Service initialized");
    console.log("HF_SPACE_URL:", this.spaceUrl || "(not set)");
    console.log(this.token ? "🔑 HF_API_TOKEN loaded" : "⚠️ No HF_API_TOKEN");
  }
}

module.exports = new RAGService();
