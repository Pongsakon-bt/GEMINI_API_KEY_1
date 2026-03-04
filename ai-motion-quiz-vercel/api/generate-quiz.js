// Vercel Serverless Function (Backend)
// ใช้ Node.js runtime ของ Vercel

export default async function handler(req, res) {
  // รับเฉพาะ Method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // ตรวจสอบว่ามี API Key หรือไม่
    if (!apiKey || apiKey.trim() === "") {
      console.error("Missing GEMINI_API_KEY in environment variables");
      return res.status(500).json({ error: "API Key is missing. Please set GEMINI_API_KEY in Vercel settings." });
    }

    // คำสั่งควบคุม AI (System Instruction)
    const systemPrompt = `คุณคือครูผู้เชี่ยวชาญที่สร้างข้อสอบได้น่าตื่นเต้น 
    จงสร้างข้อสอบจำนวน 20 ข้อ ตามหัวข้อที่ได้รับ 
    ต้องตอบกลับเป็น JSON Object รูปแบบนี้เท่านั้น: 
    {
      "refined_title": "ชื่อหัวข้อภาษาไทย",
      "questions": [
        {
          "q": "คำถามภาษาไทย",
          "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
          "a": "ตัวเลือกที่ถูกต้องเป๊ะๆ (ต้องตรงกับ 1 ใน 4 ตัวเลือก)"
        }
      ]
    }
    ห้ามมีคำเกริ่น ห้ามมี Markdown backticks ห้ามมีคำอธิบายอื่นเด็ดขาด`;

    // ยิงคำขอไปหา Gemini 1.5 Flash (รุ่นที่เสถียรและเร็วที่สุด)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `หัวข้อ: ${prompt}\n\n${systemPrompt}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    });

    if (!aiResponse.ok) {
      const errorDetail = await aiResponse.json();
      console.error("Gemini API Error:", errorDetail);
      return res.status(aiResponse.status).json({ error: "Gemini API responded with an error." });
    }

    const data = await aiResponse.json();
    
    // ตรวจสอบโครงสร้างข้อมูลที่ AI ตอบกลับมา
    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts[0].text) {
      throw new Error("Invalid response structure from AI");
    }

    // ส่งข้อมูลกลับไปที่หน้าบ้าน (Frontend)
    res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));

  } catch (error) {
    console.error("Backend Crash:", error);
    res.status(500).json({ error: "Backend failed to process the request: " + error.message });
  }
}
