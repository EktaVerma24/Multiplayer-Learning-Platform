// server/src/controllers/noteController.js
import Note from "../models/Note.js";
import axios from "axios";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const visionClient = new vision.ImageAnnotatorClient();

// POST /api/notes/generate
export const generateNotes = async (req, res) => {
    try {
        const { syllabus } = req.body;
        
        // The 'protect' middleware ensures req.user will exist.
        const userId = req.user._id;

        if (!syllabus) {
            return res.status(400).json({ error: "Syllabus is required" });
        }

        // --- GEMINI API Configuration ---
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_MODEL = "gemini-2.5-flash";

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        }

        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        // --- Prompt for detailed notes with optional images ---
        const detailedPrompt = `
Generate detailed study notes for the following topic: "${syllabus}". Include relevant images where they would significantly aid understanding.

The final output MUST be a raw JSON array. Do not include any other text or markdown formatting like \`\`\`json.

Each object in the array represents a section of the notes and MUST follow this exact JSON schema:
{
  "title": "A string for the main heading of the section.",
  "content": "A detailed, well-written paragraph explaining the concept thoroughly.",
  "imageUrl": "An optional, fully-qualified, and publicly accessible URL that directly links to a relevant image file (ending in .png, .jpg, .svg, or .gif). If no valid image is found, this field MUST be null."
}
Important: DO NOT use images from Wikimedia, Wikipedia, or any site ending with *.wikimedia.org or *.wikipedia.org. 
If you cannot find a suitable alternative, set "imageUrl": null.
HERE IS AN EXAMPLE of the desired output for the topic "Photosynthesis":
[{
  "title": "Overview of Photosynthesis",
  "content": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigment. This process generally involves the green pigment chlorophyll and generates oxygen as a byproduct.",
  "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWZfDVCJijk62semVnojOmKWuIekc65yzm7iznAHeggfO-fxWy8zzPDyfoOSDq7bEA6B0&usqp=CAU"
}, {
  "title": "Light-Dependent Reactions",
  "content": "The light-dependent reactions take place on the thylakoid membranes in the chloroplast. Chlorophyll absorbs light energy, which is converted into chemical energy in the form of ATP and NADPH. Water is split in this process, releasing oxygen.",
  "imageUrl": null
}]

Now, generate detailed written notes with optional relevant image URLs for the topic: "${syllabus}".
`;

        const requestBody = {
            systemInstruction: {
                parts: [{
                    text: "You are an expert academic assistant that generates structured, text-only study notes in a clean JSON format."
                }]
            },
            contents: [{
                role: "user",
                parts: [{
                    text: detailedPrompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        };


        const aiResponse = await axios.post(
            GEMINI_API_URL,
            requestBody, { headers: { "Content-Type": "application/json" } }
        );

        const aiData = aiResponse.data.candidates[0].content.parts[0].text;

        const note = new Note({
            syllabus: syllabus,
            sections: JSON.parse(aiData.replace(/```json\n|```/g, '').trim()),
            // ✅ FIX: Use the userId from the authenticated user
            createdBy: userId 
        });

        await note.save();
        res.status(201).json(note);

    } catch (error) {
        console.error("Error generating notes:", error);
        if (error.response) {
            console.error("AI Provider Full Error Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Axios Error:", error.message);
        }
        res.status(500).json({ error: "Failed to generate notes" });
    }
};

// GET /api/notes
export const getNotes = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ FIX: Find only notes where 'createdBy' matches the logged-in user's ID
        const notes = await Note.find({ createdBy: id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notes" });
    }
};

export const getImageProxy = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('Image URL is required');
        }

        const decodedUrl = decodeURIComponent(url);

        const response = await axios({
            method: 'GET',
            url: decodedUrl,
            responseType: 'stream',
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);

    } catch (error) {
        // ✅ Improved Error Handling
        if (error.response) {
            // If the external server responded with an error (like 404)
            console.error(`Proxy error for URL: ${decodeURIComponent(req.query.url)} - Status: ${error.response.status}`);
            res.status(error.response.status).send(error.response.statusText);
        } else {
            // For other errors (like network issues)
            console.error("Image proxy error:", error.message);
            res.status(500).send('Failed to fetch image');
        }
    }
};

export const generateSummary = async (req, res) => {
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m)
    });
  
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided.' });
      }
  
      // --- NEW: Image Pre-processing with Sharp ---
      const base64ImageData = image.replace(/^data:image\/png;base64,/, "");
      const imageBuffer = Buffer.from(base64ImageData, 'base64');
  
      // Convert to black and white, increase contrast, and sharpen
      const processedImageBuffer = await sharp(imageBuffer)
        .grayscale()
        .threshold(128) // This creates a pure black & white image
        .sharpen()
        .toBuffer();

        console.log(processedImageBuffer);
        
      // --- Step 1: OCR with Tesseract.js ---
      console.log("Starting OCR process with Tesseract...");
      
      // Give the PROCESSED image to Tesseract
      const { data: { text } } = await worker.recognize(processedImageBuffer);

      const extractedText = text;
      console.log("OCR Finished. Extracted Text:", extractedText);
  
      if (!extractedText || !extractedText.trim()) {
        return res.json({ summary: "No text was detected on the whiteboard." });
      }
  
      // --- Step 2: Summarization with Gemini ---
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Corrected model name
      const prompt = `Summarize the following notes from a whiteboard: "${extractedText}"`;
  
      const summaryResult = await model.generateContent(prompt);
      const summaryResponse = summaryResult.response;
      const summaryText = summaryResponse.text();
  
      res.json({ summary: summaryText });
  
    } catch (error) {
      console.error('Error in AI processing:', error);
      res.status(500).json({ error: 'Failed to process the whiteboard image.' });
    } finally {
      await worker.terminate();
      console.log("Tesseract worker terminated.");
    }
  }