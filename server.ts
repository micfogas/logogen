import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  app.post('/api/generate-logo', async (req, res) => {
    try {
      const { description, imageSize } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A clean, professional company logo. ${description}` }],
        },
        config: {
          // Setting the request config for image generation
          // @ts-ignore - The types might be slightly out of date but these config properties are correct based on documentation
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: imageSize || '1K',
          },
        },
      });
      
      let base64Image = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (!base64Image) {
        return res.status(500).json({ error: 'No image generated' });
      }
      
      res.json({ image: base64Image });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/generate-video', upload.single('image'), async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const file = req.file;
      const base64Image = req.body.base64Image;
      
      let imageBytes = '';
      let mimeType = '';
      
      if (file) {
         imageBytes = file.buffer.toString('base64');
         mimeType = file.mimetype;
      } else if (base64Image) {
         const parts = base64Image.split(',');
         const mimeMatch = parts[0].match(/:(.*?);/);
         if (mimeMatch && mimeMatch[1]) {
             mimeType = mimeMatch[1];
             imageBytes = parts[1];
         }
      } 
      
      if (!imageBytes || !mimeType) {
         return res.status(400).json({ error: 'No image provided' });
      }

      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this logo professionally',
        image: {
          imageBytes: imageBytes,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio || '16:9'
        }
      });
      
      res.json({ operationName: operation.name });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      
      if (!updated.done) {
        return res.status(400).json({ error: 'Video generation not complete' });
      }
      
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(500).json({ error: 'Video URI not found in response' });
      }
      
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      });
      
      res.setHeader('Content-Type', 'video/mp4');
      videoRes.body!.pipeTo(
        new WritableStream({
          write(chunk) { res.write(chunk); },
          close() { res.end(); },
        })
      );
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
