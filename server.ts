import express from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function getRuleBasedAssessment(athlete: any, recentSessions: any[], fitnessTests: any[], wellnessLogs: any[], bodyPainPoints: any[]) {
  const acwr = athlete.acwr || 1.1;
  const readiness = athlete.readinessScore || 75;
  const pains = bodyPainPoints && bodyPainPoints.length > 0 
    ? bodyPainPoints.map((p: any) => `${p.location} (Skala ${p.painLevel}/10)`).join(', ') 
    : 'Tidak ada keluhan nyeri signifikan';

  let statusCat = 'Optimal';
  let loadRecommendation = 'Pertahankan intensitas terprogram sesuai mikro-siklus.';
  let riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' = 'Rendah';
  
  if (acwr > 1.5) {
    statusCat = 'Beban Berlebih (Danger Zone)';
    loadRecommendation = 'Kurangi volume dan intensitas latihan 30-40% untuk mencegah cedera overuse. Hindari sesi sprint maksimal atau plyometrik berat.';
    riskLevel = 'Tinggi';
  } else if (acwr > 1.3) {
    statusCat = 'Waspada Lonjakan Beban (Elevated Load)';
    loadRecommendation = 'Pantau tanda-tanda kelelahan neuromuskular. Batasi durasi sesi kontak tinggi dan fokus pada pemeliharaan teknik.';
    riskLevel = 'Sedang';
  } else if (acwr < 0.8) {
    statusCat = 'Under-Training (Kondisi Kurang Terstimulasi)';
    loadRecommendation = 'Tingkatkan beban latihan secara progresif (maksimal kenaikan 10% per minggu) untuk membangun kapasitas kronis.';
    riskLevel = 'Rendah';
  }

  if (readiness < 60) {
    loadRecommendation += ' Skor kesiapan (Readiness) rendah; berikan porsi pemulihan aktif (active recovery) atau sesi taktis berintensitas ringan.';
  }

  return {
    overallStatus: `${statusCat} (Readiness: ${readiness}%, ACWR: ${acwr.toFixed(2)})`,
    riskLevel,
    workloadInsights: `Beban kronis atlet berada pada level yang membutuhkan pengelolaan teliti. Nilai ACWR ${acwr.toFixed(2)} mengindikasikan rasio beban akut dibanding beban fondasi 28 hari terakhir.`,
    loadPrescription: loadRecommendation,
    recoveryProtocols: [
      'Protokol Hidroterapi: Kontras mandi air dingin (10-12°C selama 1-2 menit) dan air hangat (38°C selama 2 menit) sebanyak 3-4 siklus.',
      'Target tidur 8-9 jam dengan lingkungan bersuhu sejuk dan minim paparan blue-light 1 jam sebelum tidur.',
      'Nutrisi pemulihan: Rasio karbohidrat:protein 3:1 dalam 45 menit pasca-latihan (contoh: susu cokelat rendah lemak atau smoothies pisang whey).',
      'Foam rolling dan dynamic mobility pada area paha depan, hamstring, dan mobilitas pergelangan kaki.'
    ],
    injuryConsiderations: `Catatan area keluhan: ${pains}. Wajib dilakukan monitoring ROM (Range of Motion) dan pre-activation sebelum sesi latihan inti.`,
    suggestedTarget: `Fokus pada peningkatan fondasi aerobik (VO2 Max) dan pencegahan asimetri kekuatan tungkai.`
  };
}

// Endpoint for AI Sports Science Physical Condition Analysis
app.post('/api/analyze-athlete', async (req, res) => {
  const { athlete, recentSessions, fitnessTests, wellnessLogs, bodyPainPoints } = req.body;

  if (!athlete) {
    return res.status(400).json({ error: 'Data atlet tidak lengkap' });
  }

  if (!ai) {
    const fallbackAssessment = getRuleBasedAssessment(athlete, recentSessions, fitnessTests, wellnessLogs, bodyPainPoints);
    return res.json({
      analysis: fallbackAssessment,
      source: 'rule-engine'
    });
  }

  try {
    const prompt = `Anda adalah seorang Sports Scientist & Fisiologis Olahraga Profesional kelas dunia (spesialis konsisi fisik atlet, ACWR workload monitoring, dan pencegahan cedera).
Analisis data fisik atlet berikut dan berikan rekomendasi ilmiah praktis dalam Bahasa Indonesia:

[DATA ATLET]
Nama: ${athlete.name}
Cabor: ${athlete.sport} (${athlete.position || 'Umum'})
Usia: ${athlete.age} tahun | TB: ${athlete.height} cm | BB: ${athlete.weight} kg
BMI: ${(athlete.weight / ((athlete.height / 100) ** 2)).toFixed(1)} | Estimasi Body Fat: ${athlete.bodyFat || 12}%
ACWR (Acute:Chronic Workload Ratio): ${athlete.acwr?.toFixed(2) || '1.10'}
Skor Kesiapan (Readiness Score): ${athlete.readinessScore || 80}/100
Denyut Nadi Istirahat (RHR): ${athlete.restingHeartRate || 54} bpm

[BEBAN LATIHAN & WELLNESS TERAKHIR]
Sesi terakhir: ${JSON.stringify(recentSessions || [])}
Data Kuesioner Hooper / Wellness 7 hari: ${JSON.stringify(wellnessLogs || [])}
Keluhan Nyeri / Cedera Tubuh Saat Ini: ${JSON.stringify(bodyPainPoints || [])}
Hasil Tes Fisik Terakhir: ${JSON.stringify(fitnessTests || [])}

Berikan output dalam format JSON murni dengan struktur berikut:
{
  "overallStatus": "Ringkasan 1-2 kalimat status fisik atlet saat ini",
  "riskLevel": "Rendah / Sedang / Tinggi",
  "workloadInsights": "Analisis tajam mengenai beban akut vs kronis dan adaptasi fisiologis atlet",
  "loadPrescription": "Rekomendasi spesifik penyesuaian beban latihan hari ini / sesi berikutnya (misal: kurangi volume 20%, latihan tanpa beban kejut, dsb)",
  "recoveryProtocols": ["Protokol 1", "Protokol 2", "Protokol 3", "Protokol 4"],
  "injuryConsiderations": "Peringatan khusus terkait titik nyeri tubuh yang dilaporkan dan instruksi fisioterapi",
  "suggestedTarget": "Target peningkatan fisik jangka menengah untuk cabor tersebut"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = getRuleBasedAssessment(athlete, recentSessions, fitnessTests, wellnessLogs, bodyPainPoints);
    }

    return res.json({
      analysis: parsed,
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.warn('Gemini API call encountered temporary issue, returning sports science rule-based analysis:', error?.message);
    const fallbackAssessment = getRuleBasedAssessment(athlete, recentSessions, fitnessTests, wellnessLogs, bodyPainPoints);
    return res.json({
      analysis: fallbackAssessment,
      source: 'rule-engine-fallback'
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PERFORMIQ running locally: http://localhost:${port}`);
    const networkInterfaces = os.networkInterfaces();
    Object.values(networkInterfaces).forEach((addresses) => {
      addresses?.forEach((address) => {
        if (address.family === 'IPv4' && !address.internal) {
          console.log(`Open on a device on the same Wi-Fi: http://${address.address}:${port}`);
        }
      });
    });
  });
}

startServer();
