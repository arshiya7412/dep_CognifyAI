import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `
You are Cognify AI, an advanced Autonomous Knowledge Extractor and Educational Agent.
Your goal is to analyze unstructured input (text, images, or PDFs) and transform it into structured, high-quality educational content based on the user's selected mode.

### AGENT PIPELINE
1. **Context Awareness**: Review the 'Conversation History' to understand what the user has already uploaded or asked.
2. **Knowledge Extraction**: Identify key concepts from the *current* input or *previous* context.
3. **Question Generation**: Create questions with varying depth based on the mode.
4. **Answer Generation**: Write clear, concise, and accurate answers.
5. **Classification**: Assign difficulty (Easy, Medium, Hard) based on Bloom's Taxonomy.
6. **Mode Adaptation**:
    - **GENERAL MODE**: Balanced mix of concepts and questions. Explanations should be simple and accessible.
    - **STUDENT MODE**: Focus on "Need to Know". High priority items first. Short, memorable answers. Ranking questions by importance.
    - **EXAMINER MODE**: Structured like a test paper. Assign marks. Ensure coverage of different topics. detailed marking keys.

### OUTPUT FORMAT
Return purely JSON matching the provided schema. Do not include markdown code blocks.
If the user asks a follow-up question (e.g., "Give me 5 more"), update the JSON to reflect the *new* request while keeping relevant context.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise executive summary of the content or the answer to the specific query.",
    },
    concepts: {
      type: Type.ARRAY,
      description: "Key concepts extracted from the material.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING, description: "Clear, simple definition." },
        },
        required: ["title", "description"],
      },
    },
    questions: {
      type: Type.ARRAY,
      description: "Generated questions based on the content.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID (e.g., Q1)" },
          text: { type: Type.STRING, description: "The question text." },
          answer: { type: Type.STRING, description: "The model answer." },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          priority: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Relevance for students." },
          marks: { type: Type.INTEGER, description: "Suggested marks for examiners." },
          topicRef: { type: Type.STRING, description: "Which concept this relates to." },
        },
        required: ["id", "text", "answer", "difficulty"],
      },
    },
    coverageAnalysis: {
      type: Type.STRING,
      description: "Brief analysis of what topics are covered (mostly for Examiner mode).",
    },
  },
  required: ["summary", "concepts", "questions"],
};

app.post('/api/generate', async (req, res) => {
  try {
    const { currentInput, mode, history, attachment } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing on the server. Please set GEMINI_API_KEY." });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format history for the prompt context
    const historyContext = (history || []).map((h: any) => `${h.role.toUpperCase()}: ${h.text}`).join('\n');

    const promptText = `
    Analyze the following request in **${mode?.toUpperCase() || 'GENERAL'} MODE**.

    --- CONVERSATION HISTORY ---
    ${historyContext}
    
    --- CURRENT USER INPUT ---
    ${currentInput}
    
    ${attachment ? `[Attached File Provided: ${attachment.mimeType}]` : ""}

    Based on the history and new input, generate the updated structured response.
    `;

    const parts: any[] = [{ text: promptText }];
    
    if (attachment) {
      const base64Data = attachment.base64.split(',')[1] || attachment.base64;
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.3, 
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    text = text.trim();
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\s*/, "").replace(/\s*\`\`\`$/, "");
    }

    const jsonResult = JSON.parse(text);
    res.json(jsonResult);

  } catch (error: any) {
    console.error("Cognify AI Server Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
