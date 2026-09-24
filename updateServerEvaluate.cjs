const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const imports = `import { GoogleGenAI, Type } from "@google/genai";\n`;
code = code.replace("import { createServer as createViteServer } from 'vite';", "import { createServer as createViteServer } from 'vite';\n" + imports);

const newEndpoint = `
app.post('/api/evaluate-sentence', async (req, res) => {
  const { sentence, targetWord } = req.body;
  if (!sentence || !targetWord) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Fallback if no API key
  if (!process.env.GEMINI_API_KEY) {
    const containsWord = sentence.toLowerCase().includes(targetWord.word.toLowerCase());
    const isLongEnough = sentence.trim().split(' ').length >= 3;
    if (containsWord && isLongEnough) {
      return res.json({ correct: true, feedback: "Great job! Your sentence uses the word correctly. (Fallback AI)" });
    } else if (!containsWord) {
      return res.json({ correct: false, feedback: \`Try to include the word "\${targetWord.word}" in your sentence. (Fallback AI)\` });
    } else {
      return res.json({ correct: false, feedback: "Your sentence is a bit too short. Add more details! (Fallback AI)" });
    }
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = \`Evaluate this sentence written by a student learning English vocabulary.
Target word: "\${targetWord.word}"
Meaning of target word: "\${targetWord.meaning}"
Student's sentence: "\${sentence}"

Task: 
1. Check if the student used the target word.
2. Check if the target word is used correctly according to its meaning.
3. Check if the sentence is grammatically correct and makes sense.
4. Give brief, encouraging feedback. If it's wrong, explain why gently.\`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: {
              type: Type.BOOLEAN,
              description: "Whether the sentence correctly and grammatically uses the target word.",
            },
            feedback: {
              type: Type.STRING,
              description: "Brief, encouraging feedback for the student.",
            },
          },
          required: ["correct", "feedback"],
        },
      },
    });

    const text = response.text.trim();
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback if API fails
    const containsWord = sentence.toLowerCase().includes(targetWord.word.toLowerCase());
    const isLongEnough = sentence.trim().split(' ').length >= 3;
    if (containsWord && isLongEnough) {
      return res.json({ correct: true, feedback: "Great job! Your sentence uses the word correctly. (Fallback AI)" });
    } else {
      return res.json({ correct: false, feedback: "Your sentence is a bit too short or missing the word. (Fallback AI)" });
    }
  }
});
`;

code = code.replace("app.post('/api/auth/login', (req, res) => {", newEndpoint + "\napp.post('/api/auth/login', (req, res) => {");

fs.writeFileSync('server.ts', code);
