import jsPDF from 'jspdf';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord, BodyPainPoint, PerformanceGoal } from '../types/athlete';
import { getACWRInfo } from './sportsScience';

export interface GenerateAthletePDFParams {
  athlete: Athlete;
  trainingSessions: TrainingSessionLog[];
  wellnessLogs: WellnessLog[];
  fitnessTests: FitnessTestRecord[];
  painPoints: BodyPainPoint[];
  goals: PerformanceGoal[];
}

export function generateAthleteReportPDF({
  athlete,
  trainingSessions,
  wellnessLogs,
  fitnessTests,
  painPoints,
  goals,
}: GenerateAthletePDFParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const athleteSessions = trainingSessions.filter((s) => s.athleteId === athlete.id);
  const athleteWellness = wellnessLogs
    .filter((w) => w.athleteId === athlete.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const athleteTests = fitnessTests.filter((t) => t.athleteId === athlete.id);
  const athletePains = painPoints.filter((p) => p.athleteId === athlete.id);
  const athleteGoals = goals.filter((g) => g.athleteId === athlete.id);

  const acwrInfo = getACWRInfo(athlete.acwr);
  const bmi = (athlete.weight / ((athlete.height / 100) ** 2)).toFixed(1);
  const reportDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Helper for page overflow check
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawSubHeader();
    }
  };

  const drawSubHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`ATHLETAPHYSIO SPORTS SCIENCE - LAPORAN KONDISI FISIK: ${athlete.name.toUpperCase()}`, margin, y);
    doc.text(`TANGGAL: ${reportDateStr}`, pageWidth - margin, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  // --- HEADER SECTION ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Accent bar on left
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, y, 3, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ATHLETAPHYSIO SPORTS SCIENCE LAB', margin + 7, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Laporan Evaluasi Fisiologis, Beban Kerja (ACWR), Kesiapan Bertanding & Target Atlet', margin + 7, y + 14);
  doc.text(`ID Dokumen: RPT-${athlete.id.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, margin + 7, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`STATUS: ${athlete.status.toUpperCase()}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.text(`Diterbitkan: ${reportDateStr}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.text('Fakultas Ilmu Keolahragaan & Kesehatan', pageWidth - margin - 6, y + 19, { align: 'right' });

  y += 28;

  // --- ATHLETE PROFILE SUMMARY ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(athlete.name, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${athlete.sport} - ${athlete.position}`, margin + 4, y + 11);
  doc.text(`Usia: ${athlete.age} tahun  |  Jenis Kelamin: ${athlete.gender}`, margin + 4, y + 16);
  doc.text(`Tinggi: ${athlete.height} cm  |  Berat: ${athlete.weight} kg  |  BMI: ${bmi} kg/m²`, margin + 4, y + 21);

  // Column 2: Key Vitals
  const col2X = margin + contentWidth * 0.55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SKOR KESIAPAN (READINESS):', col2X, y + 7);
  doc.setFontSize(12);
  doc.setTextColor(athlete.readinessScore >= 80 ? 16 : athlete.readinessScore >= 65 ? 217 : 225, athlete.readinessScore >= 80 ? 185 : athlete.readinessScore >= 65 ? 119 : 29, athlete.readinessScore >= 80 ? 129 : 6);
  doc.text(`${athlete.readinessScore}%`, col2X + 60, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Resting HR: ${athlete.restingHeartRate || 52} bpm  |  Body Fat: ${athlete.bodyFat || 10.5}%`, col2X, y + 14);
  doc.text(`Total Sesi Tercatat: ${athleteSessions.length} sesi  |  Tes Fisik: ${athleteTests.length} kali`, col2X, y + 20);

  y += 31;

  // --- WORKLOAD & ACWR ANALYSIS (Gabbett Model) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ANALISIS BEBAN KERJA & ACWR (ACUTE:CHRONIC WORKLOAD RATIO)', margin, y);
  y += 3;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'S');

  // Workload Metric Boxes
  const boxW = (contentWidth - 6) / 3;
  // Acute
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 2, y + 2, boxW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ACUTE LOAD (7 HARI)', margin + 4, y + 6);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${athlete.acuteLoad} AU`, margin + 4, y + 12);

  // Chronic
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 2 + boxW + 1, y + 2, boxW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CHRONIC LOAD (28 HARI)', margin + 4 + boxW + 1, y + 6);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${athlete.chronicLoad} AU`, margin + 4 + boxW + 1, y + 12);

  // ACWR Ratio
  let acwrBg = [236, 253, 245]; // green
  let acwrText = [4, 120, 87];
  if (athlete.acwr > 1.5) {
    acwrBg = [255, 241, 242]; // red
    acwrText = [190, 18, 60];
  } else if (athlete.acwr > 1.3) {
    acwrBg = [254, 243, 199]; // amber
    acwrText = [180, 83, 9];
  } else if (athlete.acwr < 0.8) {
    acwrBg = [240, 249, 255]; // blue
    acwrText = [3, 105, 161];
  }

  doc.setFillColor(acwrBg[0], acwrBg[1], acwrBg[2]);
  doc.rect(margin + 2 + (boxW + 1) * 2, y + 2, boxW - 2, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(acwrText[0], acwrText[1], acwrText[2]);
  doc.text('RASIO ACWR', margin + 4 + (boxW + 1) * 2, y + 6);
  doc.setFontSize(11);
  doc.text(`${athlete.acwr.toFixed(2)} - ${acwrInfo.label.split('(')[0].trim()}`, margin + 4 + (boxW + 1) * 2, y + 12);

  // Recommendations
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Evaluasi Risiko Cedera:', margin + 3, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(acwrInfo.riskDescription, margin + 37, y + 21, { maxWidth: contentWidth - 40 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Rekomendasi Beban:', margin + 3, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(acwrInfo.actionRecommendation, margin + 37, y + 28, { maxWidth: contentWidth - 40 });

  y += 39;

  // --- PERFORMANCE GOALS STATUS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. STATUS TARGET PERFORMA INDIVIDUAL (${athleteGoals.length} SASARAN)`, margin, y);
  y += 3;

  if (athleteGoals.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada sasaran performa khusus yang dikonfigurasi untuk atlet ini.', margin + 4, y + 6);
    y += 14;
  } else {
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('SASARAN PERFORMA & LATIHAN', margin + 3, y + 4.2);
    doc.text('KATEGORI', margin + 72, y + 4.2);
    doc.text('BASELINE', margin + 105, y + 4.2);
    doc.text('SAAT INI', margin + 125, y + 4.2);
    doc.text('TARGET', margin + 145, y + 4.2);
    doc.text('PROGRES', margin + 165, y + 4.2);
    y += 6;

    athleteGoals.forEach((g, idx) => {
      checkPageBreak(9);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, y, contentWidth, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7.5, margin + contentWidth, y + 7.5);

      let progress = 0;
      if (g.higherIsBetter) {
        const range = g.targetValue - g.baselineValue;
        progress = range > 0 ? ((g.currentValue - g.baselineValue) / range) * 100 : 100;
      } else {
        const range = g.baselineValue - g.targetValue;
        progress = range > 0 ? ((g.baselineValue - g.currentValue) / range) * 100 : 100;
      }
      const clampedPct = Math.max(0, Math.min(100, Math.round(progress)));
      const isAchieved = g.status === 'Achieved' || clampedPct >= 100;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const titleText = g.title + (g.exerciseName ? ` (${g.exerciseName})` : '');
      doc.text(titleText.length > 40 ? titleText.slice(0, 38) + '...' : titleText, margin + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(g.category, margin + 72, y + 5);

      doc.text(`${g.baselineValue} ${g.unit}`, margin + 105, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${g.currentValue} ${g.unit}`, margin + 125, y + 5);

      doc.setTextColor(4, 120, 87);
      doc.text(`${g.targetValue} ${g.unit}`, margin + 145, y + 5);

      doc.setTextColor(isAchieved ? 4 : 3, isAchieved ? 120 : 105, isAchieved ? 87 : 161);
      doc.text(`${clampedPct}% (${isAchieved ? 'Tercapai' : 'Berjalan'})`, margin + 165, y + 5);

      y += 7.5;
    });

    y += 5;
  }

  // --- RECENT WELLNESS & FATIGUE TRENDS ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. TREN KESIAPAN & PEMULIHAN HARIAN (WELLNESS MONITORING)', margin, y);
  y += 3;

  if (athleteWellness.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada log wellness yang dicatat untuk atlet ini.', margin + 4, y + 6);
    y += 14;
  } else {
    // Wellness Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('TANGGAL', margin + 3, y + 4.2);
    doc.text('KESIAPAN', margin + 28, y + 4.2);
    doc.text('TIDUR (JAM / SKL)', margin + 52, y + 4.2);
    doc.text('SORENESS', margin + 86, y + 4.2);
    doc.text('FATIGUE', margin + 107, y + 4.2);
    doc.text('STRESS/MOOD', margin + 126, y + 4.2);
    doc.text('R-HR', margin + 152, y + 4.2);
    doc.text('CATATAN SUBJEKTIF', margin + 164, y + 4.2);
    y += 6;

    const recentLogs = athleteWellness.slice(0, 5);
    recentLogs.forEach((w, idx) => {
      checkPageBreak(8);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(w.date, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(w.readinessScore >= 80 ? 4 : w.readinessScore >= 65 ? 180 : 190, w.readinessScore >= 80 ? 120 : w.readinessScore >= 65 ? 83 : 18, w.readinessScore >= 80 ? 87 : 9);
      doc.text(`${w.readinessScore}%`, margin + 28, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${w.sleepHours}j (${w.sleepQuality}/5)`, margin + 52, y + 4.5);
      doc.text(`${w.muscleSoreness}/5`, margin + 86, y + 4.5);
      doc.text(`${w.fatigue}/5`, margin + 107, y + 4.5);
      doc.text(`${w.stressLevel}/${w.mood}`, margin + 126, y + 4.5);
      doc.text(`${w.restingHR || '-'} bpm`, margin + 152, y + 4.5);

      const noteText = w.notes || 'Normal';
      doc.text(noteText.length > 25 ? noteText.slice(0, 23) + '...' : noteText, margin + 164, y + 4.5);

      y += 7;
    });

    y += 5;
  }

  // --- RECENT FITNESS TESTS & PAIN STATUS ---
  checkPageBreak(40);
  const halfW = (contentWidth - 4) / 2;

  // Box Left: Fitness Tests
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. REKAP TES FISIK TERAKHIR', margin, y);

  // Box Right: Pain Points
  doc.text('5. KELUHAN NYERI / CEDERA (VAS)', margin + halfW + 4, y);
  y += 3;

  const leftBoxY = y;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, leftBoxY, halfW, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, leftBoxY, halfW, 26, 2, 2, 'S');

  if (athleteTests.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada data tes fisik.', margin + 3, leftBoxY + 8);
  } else {
    athleteTests.slice(0, 3).forEach((t, i) => {
      const lineY = leftBoxY + 6 + i * 6.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(t.testName.length > 22 ? t.testName.slice(0, 20) + '...' : t.testName, margin + 3, lineY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${t.value} ${t.unit}`, margin + 48, lineY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(t.normGrade, margin + 70, lineY);
    });
  }

  // Pain Points on Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + halfW + 4, leftBoxY, halfW, 26, 2, 2, 'F');
  doc.roundedRect(margin + halfW + 4, leftBoxY, halfW, 26, 2, 2, 'S');

  if (athletePains.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('Bebas nyeri. Tidak ada riwayat keluhan muskuloskeletal aktif.', margin + halfW + 7, leftBoxY + 8, { maxWidth: halfW - 6 });
  } else {
    athletePains.slice(0, 3).forEach((p, i) => {
      const lineY = leftBoxY + 6 + i * 6.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(190, 18, 60);
      doc.text(`VAS ${p.painLevel}/10 (${p.status})`, margin + halfW + 7, lineY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(p.location.length > 24 ? p.location.slice(0, 22) + '...' : p.location, margin + halfW + 36, lineY);
    });
  }

  y += 31;

  // --- COACH NOTES & SIGNATURE BLOCK ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CATATAN FISIOLOGIS & PERTIMBANGAN TIM PELATIH:', margin, y);
  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const noteContent = `"${athlete.notes || 'Atlet dalam pengawasan berkala sports science. Terus lakukan evaluasi ACWR dan pemulihan.'}"`;
  doc.text(noteContent, margin + 3, y + 5, { maxWidth: contentWidth - 6 });

  y += 18;

  // Signature Block
  const sigW = (contentWidth - 20) / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Kepala Pelatih Fisik (Head S&C Coach)', margin + 15, y);
  doc.text('Fisioterapis Olahraga & Medis Tim', margin + contentWidth - 15 - sigW, y);

  y += 13;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 5, y, margin + 5 + sigW, y);
  doc.line(margin + contentWidth - sigW - 5, y, margin + contentWidth - 5, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('(                                                      )', margin + 18, y);
  doc.text('(                                                      )', margin + contentWidth - sigW - 2, y);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Dokumen resmi AthletaPhysio Sports Science Monitoring System. Informasi bersifat rahasia untuk tim pelatih dan medis.',
      margin,
      pageHeight - 6
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save PDF
  const sanitizedName = athlete.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `Laporan_Fisik_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
