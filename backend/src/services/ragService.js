// backend/src/services/ragService.js
// Improved RAG service: async IO, safe tag handling, tokenization, snippet extraction.
// Returns numeric relevance (0..100) to avoid Mongoose number casting errors.

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

class RAGService {
  constructor(options = {}) {
    this.options = {
      kbPath: path.join(__dirname, '../../knowledge-base.json'),
      topK: 3,
      minSimilarity: 0.15,
      highConfidenceThreshold: 0.4,
      watchFile: false,
      snippetMaxChars: 600,
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

  extractSnippet(query, document) {
    const maxChars = this.options.snippetMaxChars;
    const content = document.content || '';
    const qTokens = this.tokenize(query);

    if (qTokens.length === 0 || !content) {
      return content.slice(0, maxChars) + (content.length > maxChars ? '…' : '');
    }

    const lower = content.toLowerCase();
    let bestPos = -1;
    for (const token of qTokens) {
      const pos = lower.indexOf(token);
      if (pos >= 0 && (bestPos === -1 || pos < bestPos)) {
        bestPos = pos;
      }
    }

    if (bestPos === -1) {
      return content.slice(0, maxChars) + (content.length > maxChars ? '…' : '');
    }

    const start = Math.max(0, bestPos - Math.floor(maxChars / 4));
    let snippet = content.slice(start, start + maxChars);
    if (start > 0) snippet = '…' + snippet;
    if (start + maxChars < content.length) snippet = snippet + '…';
    return snippet;
  }

  generateAnswer(query, retrieved) {
    if (!retrieved || retrieved.length === 0) {
      return {
        text: "I couldn't find relevant information in the knowledge base. Please try rephrasing or consult the official sources.",
        snippet: null,
      };
    }

    const top = retrieved[0].document;
    const snippet = this.extractSnippet(query, top);

    let text = `**${top.title}**\n\n${snippet}`;

    if (retrieved.length > 1) {
      text += `\n\n**Related:**`;
      for (let i = 1; i < Math.min(retrieved.length, 5); i++) {
        const d = retrieved[i].document;
        text += `\n• ${d.title}${d.category ? ` — ${d.category}` : ''}`;
      }
    }

    text += `\n\n*Source: ${top.id} — for full details view the official site.*`;

    return { text, snippet };
  }

  async query(userQuery, opts = {}) {
    try {
      if (!userQuery || String(userQuery).trim().length === 0) {
        return { answer: "Please provide a question or search terms.", sources: [], confidence: 'low' };
      }

      const topK = opts.topK ?? this.options.topK;
      const results = await this.searchDocuments(userQuery, topK);

      console.log(`\n🔍 Query: "${userQuery}"`);
      console.log(`📚 Found ${results.length} candidate documents`);
      results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.document.title} (${Math.round(r.similarity * 100)}%)`);
      });

      if (results.length === 0 || results[0].similarity < this.options.minSimilarity) {
        return {
          answer: "I couldn't find relevant information to answer your question. Try rephrasing or consult the official sources.",
          sources: [],
          confidence: 'low',
        };
      }

      const generated = this.generateAnswer(userQuery, results);

      // IMPORTANT: return numeric relevance (0..100) to match Mongoose number fields
      return {
        answer: generated.text,
        snippet: generated.snippet,
        sources: results.map(r => ({
          id: r.document.id,
          title: r.document.title,
          relevance: Math.round(r.similarity * 100), // numeric
          category: r.document.category || null,
        })),
        confidence: results[0].similarity >= this.options.highConfidenceThreshold ? 'high' : 'medium',
      };
    } catch (err) {
      console.error('❌ RAG query error:', err.message || err);
      return { answer: 'An internal error occurred while processing your query.', sources: [], confidence: 'low' };
    }
  }

  async initialize() {
    console.log('🚀 Initializing RAG Service...');
    await this.loadKnowledgeBase();
    if (this.options.watchFile) this.watchKnowledgeBase();
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
