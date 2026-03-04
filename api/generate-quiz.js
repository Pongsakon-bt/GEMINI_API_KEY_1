// Vercel Serverless Function
export default async function handler(req, res) {
  // 1. ตรวจสอบว่าคำขอที่ส่งมาเป็นแบบ POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // 2. ดึง API Key ลับที่ซ่อนไว้ใน Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("API Key is missing!");
      return res.status(500).json({ error: "Server Configuration Error: Missing API Key" });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // 3. ยิงคำขอไปหา Gemini (ทำจากหลังบ้าน ปลอดภัย 100%)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "คุณคือครูผู้เชี่ยวชาญ สร้างข้อสอบ 20 ข้อเสมอ ในรูปแบบ JSON Object: {\"refined_title\": \"ชื่อหัวข้อที่เหมาะสม\", \"questions\": [{\"q\": \"คำถาม\", \"options\": [\"ตัวเลือก1\", \"ตัวเลือก2\", \"ตัวเลือก3\", \"ตัวเลือก4\"], \"a\": \"ตัวเลือกที่ถูกต้อง (ต้องตรงกับใน optionsเป๊ะๆ)\"}]} เท่านั้น ห้ามมี Markdown ครอบ" }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return res.status(response.status).json({ error: `Gemini API Error: ${response.statusText}` });
    }

    const data = await response.json();
    
    // 4. ส่งผลลัพธ์กลับไปให้หน้าเว็บ (Frontend)
    res.status(200).json(data);

  } catch (error) {
    console.error('Serverless Function Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}