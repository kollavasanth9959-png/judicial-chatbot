// backend/src/services/ragService.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');

const readFile = promisify(fs.readFile);

class RAGService {
  constructor(options = {}) {
    this.options = {
      kbPath: path.join(__dirname, '../../knowledge-base.json'),
      topK: 3,
      minSimilarity: 0.15,
      watchFile: false,
      ...options,
    };

    this.knowledgeBase = [];
    this.kbLastLoaded = null;
    this._watcher = null;
  }

  async loadKnowledgeBase() {
    try {
      const filePath = this.options.kbPath;
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error('knowledge-base.json must be an array of documents');
      }

      this.knowledgeBase = parsed.map((d, i) => ({
        id: d.id ?? `doc-${i}`,
        title: String(d.title ?? '').trim(),
        content: String(d.content ?? '').trim(),
        tags: Array.isArray(d.tags) ? d.tags.map(t => String(t).trim()).filter(Boolean) : [],
        category: d.category ?? null,
        raw: d,
      }));

      this.kbLastLoaded = new Date();
      console.log(`✅ Loaded ${this.knowledgeBase.length} documents from ${filePath}`);
    } catch (err) {
      console.error('❌ Error loading knowledge base:', err.message || err);
      throw err;
    }
  }

  watchKnowledgeBase() {
    if (!this.options.watchFile) return;
    const filePath = this.options.kbPath;
    if (this._watcher) return;

    try {
      this._watcher = fs.watch(filePath, { persistent: false }, async (eventType) => {
        if (eventType === 'change' || eventType === 'rename') {
          console.log('♻️ Knowledge base changed — reloading...');
          try {
            await this.loadKnowledgeBase();
          } catch (e) {
            console.error('Failed to reload knowledge base:', e.message || e);
          }
        }
      });
      console.log(`👀 Watching ${filePath} for changes`);
    } catch (e) {
      console.warn('Could not setup file watcher:', e.message || e);
    }
  }

  tokenize(text) {
    if (!text) return [];
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(t => t.length > 2);
    const seen = new Set();
    return tokens.filter(t => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  }

  calculateSimilarity(query, document) {
    if (!query || !document) return 0;
    const qTokens = this.tokenize(query);
    if (qTokens.length === 0) return 0;

    const title = (document.title ?? '').toLowerCase();
    const content = (document.content ?? '').toLowerCase();
    const tagsText = (document.tags || []).join(' ').toLowerCase();

    let score = 0;
    for (const token of qTokens) {
      if (title.includes(token)) {
        score += 3;
      } else if (tagsText.includes(token)) {
        score += 2;
      } else if (content.includes(token)) {
        score += 1;
      }
    }

    const normalized = score / (qTokens.length * 3);
    return Math.min(1, Math.max(0, normalized));
  }

  async searchDocuments(query, topK = this.options.topK) {
    const results = [];
    for (const doc of this.knowledgeBase) {
      const similarity = this.calculateSimilarity(query, doc);
      if (similarity > 0) {
        results.push({ document: doc, similarity });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  async queryHuggingFace(prompt) {
    const token = process.env.HF_API_TOKEN;
    const modelUrl = process.env.HF_MODEL_URL || 'https://api-inference.huggingface.co/models/google/flan-t5-large';

    if (!token) {
      console.warn('⚠️ HF_API_TOKEN not found. Returning fallback response.');
      return null;
    }

    try {
      console.log('🌐 Calling Hugging Face API...');
      const response = await axios.post(
        modelUrl,
        { inputs: prompt },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10s timeout
        }
      );

      // HF generic response is usually array: [{ generated_text: "..." }]
      if (Array.isArray(response.data) && response.data[0]?.generated_text) {
        return response.data[0].generated_text;
      }
      // Some models return just object
      if (response.data?.generated_text) {
        return response.data.generated_text;
      }
      return null;
    } catch (error) {
      console.error('❌ Hugging Face API Error:', error.response?.data || error.message);
      return null;
    }
  }

  async query(userQuery, opts = {}) {
    try {
      if (!userQuery || String(userQuery).trim().length === 0) {
        return { answer: "Please provide a question.", sources: [], confidence: 'low' };
      }

      // 1. Retrieve relevant context
      const topK = opts.topK ?? this.options.topK;
      const results = await this.searchDocuments(userQuery, topK);

      console.log(`\n🔍 Query: "${userQuery}"`);
      console.log(`📚 Found ${results.length} candidate documents`);

      let contextText = "";
      if (results.length > 0 && results[0].similarity >= this.options.minSimilarity) {
        contextText = results.map(r =>
          `Title: ${r.document.title}\nContent: ${r.document.content}`
        ).join('\n\n');
      }

      // 2. Construct Prompt
      // If we found context, use it. If not, the model relies on its own knowledge or admits ignorance.
      let prompt;
      if (contextText) {
        prompt = `Answer the question based strictly on the following context.\n\nContext:\n${contextText}\n\nQuestion: ${userQuery}\n\nAnswer:`;
      } else {
        // Fallback or general chat if no docs found
        prompt = `Question: ${userQuery}\n\nAnswer:`;
      }

      // 3. Generate Answer via HF
      let answer = await this.queryHuggingFace(prompt);

      // Fallback if API fails or token missing
      if (!answer) {
        answer = contextText
          ? "I found some relevant information but couldn't generate a summary at the moment. Please check the sources below."
          : "I couldn't find relevant information in the knowledge base and the AI service is currently unavailable.";
      }

      return {
        answer: answer,
        sources: results.map(r => ({
          id: r.document.id,
          title: r.document.title,
          relevance: Math.round(r.similarity * 100),
          category: r.document.category || null,
        })),
        confidence: (results.length > 0 && results[0].similarity > 0.4) ? 'high' : 'medium',
      };

    } catch (err) {
      console.error('❌ RAG query error:', err.message || err);
      return { answer: 'An internal error occurred.', sources: [], confidence: 'low' };
    }
  }

  async initialize() {
    console.log('🚀 Initializing RAG Service...');
    await this.loadKnowledgeBase();
    if (this.options.watchFile) this.watchKnowledgeBase();

    if (!process.env.HF_API_TOKEN) {
      console.warn('⚠️  WARNING: HF_API_TOKEN is missing in .env file! AI generation will not work.');
    } else {
      console.log('🔑 HF_API_TOKEN detected.');
    }

    console.log('✅ RAG Service ready!\n');
  }

  close() {
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
    }
  }
}

module.exports = new RAGService();
