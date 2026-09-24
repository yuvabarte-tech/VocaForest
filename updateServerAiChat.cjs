const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const updatedEndpoint = `
app.post('/api/evaluate-sentence', async (req, res) => {
  const { sentence, targetWord, isChat } = req.body;
  if (!sentence) {
    return res.status(400).json({ error: "Missing required fields" });
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

    let prompt = "";
    if (isChat) {
      prompt = \`You are Teacher Yuva's AI Assistant in a magical game called VocaForest. The student is asking you a question or saying something.
Student: "\${sentence}"
Respond to the student in a friendly, encouraging, and magical way. Keep it brief (1-3 sentences) and suitable for a primary school student learning English.\`;
    } else {
      prompt = \`Evaluate this sentence written by a student learning English vocabulary.
Target word: "\${targetWord.word}"
Meaning of target word: "\${targetWord.meaning}"
Student's sentence: "\${sentence}"

Task: 
1. Check if the student used the target word.
2. Check if the target word is used correctly according to its meaning.
3. Check if the sentence is grammatically correct and makes sense.
4. Give brief, encouraging feedback. If it's wrong, explain why gently.\`;
    }

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
              description: "Whether the sentence correctly and grammatically uses the target word (always true for general chat).",
            },
            feedback: {
              type: Type.STRING,
              description: "Brief, encouraging feedback or chat response for the student.",
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
    if (isChat) {
      return res.json({ correct: true, feedback: "I'm having a little trouble hearing you through the magic trees. Can we try again later?" });
    }
    const containsWord = targetWord && sentence.toLowerCase().includes(targetWord.word.toLowerCase());
    const isLongEnough = sentence.trim().split(' ').length >= 3;
    if (containsWord && isLongEnough) {
      return res.json({ correct: true, feedback: "Great job! Your sentence uses the word correctly. (Fallback AI)" });
    } else {
      return res.json({ correct: false, feedback: "Your sentence is a bit too short or missing the word. (Fallback AI)" });
    }
  }
});
`;

code = code.replace(/app\.post\('\/api\/evaluate-sentence', async \(req, res\) => \{[\s\S]*?^\}\);/m, updatedEndpoint);

fs.writeFileSync('server.ts', code);
