import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Tesseract from 'tesseract.js';
import { X, Camera, RotateCcw, Shield, AlertTriangle, CheckCircle, Loader, Zap, Banknote, ScanText } from 'lucide-react';

/**
 * MoneyDetector - Enhanced Indonesian Currency Detector
 * Detects denomination (Rp1000-Rp100000) via OCR on top-left corner
 * and performs authenticity analysis using texture + MobileNet
 */

// Valid Indonesian banknote denominations with measured RGB values
const VALID_DENOMINATIONS = [
  { nominal: 100000, name: 'Rp 100.000', color: 'Merah',         rgb: null },
  { nominal: 75000,  name: 'Rp 75.000',  color: 'Merah/Cokelat', rgb: null },
  { nominal: 50000,  name: 'Rp 50.000',  color: 'Biru',          rgb: null },
  { nominal: 20000,  name: 'Rp 20.000',  color: 'Hijau',         rgb: null },
  { nominal: 10000,  name: 'Rp 10.000',  color: 'Ungu',          rgb: [162, 150, 143] },
  { nominal: 5000,   name: 'Rp 5.000',   color: 'Cokelat',       rgb: [155, 144, 133] },
  { nominal: 2000,   name: 'Rp 2.000',   color: 'Abu-abu',       rgb: [159, 151, 143] },
  { nominal: 1000,   name: 'Rp 1.000',   color: 'Hijau',         rgb: null },
];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    h *= 360;
  }
  return { h, s, l };
}

/**
 * Crop area pojok kiri atas dari gambar uang untuk membaca nominal.
 * Pada uang Rupiah, angka nominal tercetak di pojok kiri atas.
 * Crop ~35% lebar dan ~30% tinggi dari pojok kiri atas.
 */
function cropTopLeftCorner(img) {
  const canvas = document.createElement('canvas');
  const cropW = Math.round(img.width * 0.35);
  const cropH = Math.round(img.height * 0.30);
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
}

/**
 * Preprocessing gambar: grayscale, tingkatkan kontras, lalu threshold
 * agar teks angka nominal terlihat jelas untuk OCR.
 */
function preprocessForOCR(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Step 1: Grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Step 2: Contrast enhancement (stretch histogram)
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.round(((data[i] - min) / range) * 255);
    data[i] = data[i + 1] = data[i + 2] = val;
  }

  // Step 3: Adaptive threshold - binarize for cleaner OCR
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] > 140 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Parse teks OCR untuk menemukan angka nominal uang Rupiah.
 * Mencari pola angka nominal (1000, 2000, 5000, 10000, 20000, 50000, 75000, 100000)
 * dalam teks yang terbaca. Menangani berbagai variasi format:
 * - "100.000", "100000", "100,000"
 * - "Rp100.000", "Rp 100.000"
 * - Angka dengan noise OCR (mis. "1OO.OOO" -> "100.000")
 */
function parseNominalFromText(text) {
  if (!text || text.trim().length === 0) return null;

  // Normalize: ganti O/o yang mungkin salah dibaca jadi 0, hapus spasi antar digit
  let cleaned = text
    .replace(/[oO]/g, '0')      // O -> 0 (common OCR error)
    .replace(/[lI|]/g, '1')     // l, I, | -> 1
    .replace(/[sS]/g, '5')      // S -> 5 (jarang, tapi bisa terjadi)
    .replace(/[,.\s]/g, '')     // hapus separator titik, koma, spasi
    .replace(/[^0-9]/g, ' ');   // bersihkan non-digit jadi spasi

  // Cari semua rangkaian angka
  const numberMatches = cleaned.match(/\d{3,6}/g) || [];

  // Cek setiap angka yang ditemukan terhadap nominal valid
  const validNominals = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000];

  for (const numStr of numberMatches) {
    const num = parseInt(numStr, 10);
    // Exact match
    if (validNominals.includes(num)) {
      return num;
    }
    // Jika terbaca sebagian (mis. "10000" dari "100000" terpotong)
    for (const valid of validNominals) {
      const validStr = valid.toString();
      if (validStr.includes(numStr) || numStr.includes(validStr)) {
        return valid;
      }
    }
  }

  // Fallback: cek pola "100" bisa berarti 100.000, dst.
  const shortMatches = cleaned.match(/\d{1,3}/g) || [];
  const shortMap = { '100': 100000, '75': 75000, '50': 50000, '20': 20000, '10': 10000, '5': 5000, '2': 2000, '1': 1000 };
  for (const s of shortMatches) {
    if (shortMap[s]) return shortMap[s];
  }

  return null;
}

/**
 * Deteksi nominal uang menggunakan OCR pada pojok kiri atas.
 * Returns: { denomination, confidence, ocrText, croppedImageUrl }
 */
async function detectDenominationOCR(img) {
  // Step 1: Crop pojok kiri atas
  const croppedCanvas = cropTopLeftCorner(img);
  const croppedImageUrl = croppedCanvas.toDataURL('image/png');

  // Step 2: Buat versi preprocessed untuk OCR
  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = croppedCanvas.width;
  ocrCanvas.height = croppedCanvas.height;
  const ocrCtx = ocrCanvas.getContext('2d');
  ocrCtx.drawImage(croppedCanvas, 0, 0);
  preprocessForOCR(ocrCanvas);

  // Step 3: Jalankan OCR dengan Tesseract.js
  // Coba dua mode: digits-only dan mixed, ambil yang berhasil
  let ocrText = '';
  let confidence = 0;

  try {
    // Recognize dengan Tesseract - fokus angka
    const result = await Tesseract.recognize(ocrCanvas.toDataURL('image/png'), 'eng', {
      logger: () => {},
    });
    ocrText = result.data.text || '';
    confidence = result.data.confidence || 0;
  } catch (err) {
    console.error('OCR error:', err);
  }

  // Step 4: Parse nominal dari teks OCR
  const nominal = parseNominalFromText(ocrText);
  const denomination = nominal
    ? VALID_DENOMINATIONS.find(d => d.nominal === nominal) || null
    : null;

  // Hitung confidence akhir berdasarkan:
  // - OCR confidence dari Tesseract
  // - Apakah nominal valid ditemukan
  let finalConfidence;
  if (denomination) {
    finalConfidence = Math.round(Math.min(Math.max(confidence * 0.9, 40), 95));
  } else {
    finalConfidence = Math.round(Math.min(Math.max(confidence * 0.3, 10), 30));
  }

  return {
    denomination,
    confidence: finalConfidence,
    ocrText: ocrText.trim(),
    croppedImageUrl,
  };
}

const MoneyDetector = ({ onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        setLoadingProgress(10);
        await tf.ready();
        setLoadingProgress(30);
        const loadedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        setLoadingProgress(100);
        if (isMounted) { setModel(loadedModel); setIsModelLoading(false); }
      } catch (err) {
        console.error('Failed to load model:', err);
        if (isMounted) { setError('Gagal memuat model AI. Pastikan koneksi internet stabil.'); setIsModelLoading(false); }
      }
    };
    loadModel();
    const pi = setInterval(() => { setLoadingProgress(prev => prev >= 90 ? (clearInterval(pi), prev) : prev + Math.random() * 15); }, 500);
    return () => { isMounted = false; clearInterval(pi); };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = mediaStream;
      if (videoRef.current) { videoRef.current.srcObject = mediaStream; videoRef.current.play(); setIsCameraActive(true); }
    } catch { setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.'); }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setIsCameraActive(false);
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    setResult(null);
  };

  /**
   * Denomination detection now uses OCR (Tesseract.js) to read
   * the nominal text printed on the top-left corner of the banknote.
   * The old color-profile-matching approach has been replaced entirely.
   */

  // Detect light reflection / specular highlights (glossy = fake)
  const detectReflection = (data, totalPx) => {
    let brightSpots = 0, veryBright = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      if (r > 230 && g > 230 && b > 230) brightSpots++;
      if (r > 245 && g > 245 && b > 245) veryBright++;
    }
    const reflectionRatio = brightSpots / totalPx;
    const glareRatio = veryBright / totalPx;
    return { reflectionRatio, glareRatio, hasReflection: reflectionRatio > 0.05, hasGlare: glareRatio > 0.02 };
  };

  const analyzeImage = async () => {
    if (!model || !capturedImage) return;
    setIsAnalyzing(true); setResult(null);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = capturedImage; });

      const predictions = await model.classify(img, 10);

      const ac = analysisCanvasRef.current;
      const ctx = ac.getContext('2d', { willReadFrequently: true });
      const aw = 300, ah = Math.round((img.height / img.width) * aw);
      ac.width = aw; ac.height = ah;
      ctx.drawImage(img, 0, 0, aw, ah);
      const imageData = ctx.getImageData(0, 0, aw, ah);
      const data = imageData.data;
      const totalPx = data.length / 4;

      // Color analysis for authenticity (still needed for auth scoring)
      let rSum=0, gSum=0, bSum=0, satSum=0, briSum=0, rSq=0, gSq=0, bSq=0;
      for (let i = 0; i < data.length; i += 4) {
        const r=data[i], g=data[i+1], b=data[i+2];
        rSum+=r; gSum+=g; bSum+=b; rSq+=r*r; gSq+=g*g; bSq+=b*b;
        const hsl = rgbToHsl(r, g, b);
        satSum += hsl.s; briSum += hsl.l;
      }
      const avgR=rSum/totalPx, avgG=gSum/totalPx, avgB=bSum/totalPx;
      const avgSat=satSum/totalPx, avgBri=briSum/totalPx;
      const colorVar = ((rSq/totalPx - avgR**2) + (gSq/totalPx - avgG**2) + (bSq/totalPx - avgB**2)) / 3;

      // Edge/texture analysis
      let edgeCount=0, detailCount=0;
      for (let y=1; y<ah-1; y++) {
        for (let x=1; x<aw-1; x++) {
          const idx=(y*aw+x)*4;
          const gray=(data[idx]+data[idx+1]+data[idx+2])/3;
          const lG=(data[((y)*aw+(x-1))*4]+data[((y)*aw+(x-1))*4+1]+data[((y)*aw+(x-1))*4+2])/3;
          const rG=(data[((y)*aw+(x+1))*4]+data[((y)*aw+(x+1))*4+1]+data[((y)*aw+(x+1))*4+2])/3;
          const tG=(data[((y-1)*aw+x)*4]+data[((y-1)*aw+x)*4+1]+data[((y-1)*aw+x)*4+2])/3;
          const bG=(data[((y+1)*aw+x)*4]+data[((y+1)*aw+x)*4+1]+data[((y+1)*aw+x)*4+2])/3;
          const mag=Math.sqrt((rG-lG)**2+(bG-tG)**2);
          if(mag>30) edgeCount++;
          if(mag>10&&mag<=30) detailCount++;
        }
      }
      const totalAP=(aw-2)*(ah-2);
      const edgeDensity=edgeCount/totalAP, detailDensity=detailCount/totalAP;
      const texComplexity=(edgeCount+detailCount)/totalAP;

      // Denomination detection via OCR on top-left corner
      const denomResult = await detectDenominationOCR(img);

      // Light reflection / glare detection
      const reflection = detectReflection(data, totalPx);

      // Authenticity scoring
      let score = 50;
      const factors = [];

      // F1: Light reflection check (MOST IMPORTANT - glossy = fake)
      if (reflection.hasGlare) {
        score -= 30;
        factors.push({ label: 'Pantulan cahaya kuat terdeteksi (permukaan glossy = ciri uang palsu)', score: Math.round(reflection.glareRatio * 1000), positive: false });
      } else if (reflection.hasReflection) {
        score -= 18;
        factors.push({ label: 'Pantulan cahaya terdeteksi (kertas terlalu mengkilap)', score: Math.round(reflection.reflectionRatio * 500), positive: false });
      } else {
        score += 12;
        factors.push({ label: 'Tidak ada pantulan berlebihan (permukaan matte, ciri asli)', score: Math.round((1 - reflection.reflectionRatio) * 100), positive: true });
      }

      // F2: MobileNet object detection
      const moneyKW = ['bill','money','banknote','currency','envelope','paper','card','ticket','notebook','book jacket','wallet'];
      const moneyPred = predictions.filter(p => moneyKW.some(kw => p.className.toLowerCase().includes(kw)));
      if (moneyPred.length > 0) {
        score += moneyPred[0].probability * 12;
        factors.push({ label: 'Objek terdeteksi sebagai uang kertas', score: Math.round(moneyPred[0].probability * 100), positive: true });
      } else {
        score -= 8;
        factors.push({ label: 'Objek tidak teridentifikasi sebagai uang', score: 0, positive: false });
      }

      // F3: Color saturation
      if (avgSat > 0.15 && avgSat < 0.7) {
        score += 10;
        factors.push({ label: 'Saturasi warna normal (ciri uang asli)', score: Math.round(avgSat * 100), positive: true });
      } else {
        score -= avgSat <= 0.15 ? 12 : 8;
        factors.push({ label: avgSat <= 0.15 ? 'Warna terlalu pudar' : 'Warna terlalu jenuh (cetak ulang)', score: Math.round(avgSat * 100), positive: false });
      }

      // F4: Texture complexity
      if (texComplexity > 0.15 && texComplexity < 0.6) {
        score += 12;
        factors.push({ label: 'Tekstur micro-printing terdeteksi baik', score: Math.round(texComplexity * 100), positive: true });
      } else {
        score -= texComplexity <= 0.15 ? 10 : 5;
        factors.push({ label: texComplexity <= 0.15 ? 'Kurang detail micro-printing (ciri palsu)' : 'Tekstur terlalu kasar', score: Math.round(texComplexity * 100), positive: false });
      }

      // F5: Edge density
      if (edgeDensity > 0.05 && edgeDensity < 0.25) {
        score += 8;
        factors.push({ label: 'Ketajaman garis & watermark baik', score: Math.round(edgeDensity * 400), positive: true });
      } else {
        score -= 6;
        factors.push({ label: 'Ketajaman garis tidak optimal', score: Math.round(edgeDensity * 400), positive: false });
      }

      // F6: Color variance
      if (colorVar > 1500 && colorVar < 6000) {
        score += 8;
        factors.push({ label: 'Variasi warna konsisten dengan uang asli', score: Math.round(Math.min(colorVar / 60, 100)), positive: true });
      } else {
        score -= 6;
        factors.push({ label: colorVar <= 1500 ? 'Pola warna terlalu datar' : 'Variasi warna berlebihan', score: Math.round(Math.min(colorVar / 60, 100)), positive: false });
      }

      score = Math.max(0, Math.min(100, Math.round(score)));

      let verdict, verdictClass;
      if (score >= 70) { verdict = 'KEMUNGKINAN ASLI'; verdictClass = 'genuine'; }
      else if (score >= 45) { verdict = 'PERLU VERIFIKASI LEBIH LANJUT'; verdictClass = 'uncertain'; }
      else { verdict = 'KEMUNGKINAN PALSU'; verdictClass = 'counterfeit'; }

      setResult({
        score, verdict, verdictClass, factors,
        denomination: denomResult.denomination,
        denomConfidence: denomResult.confidence,
        ocrText: denomResult.ocrText,
        croppedImageUrl: denomResult.croppedImageUrl,
        predictions: predictions.slice(0, 5),
        reflection,
        colorInfo: { avgR: Math.round(avgR), avgG: Math.round(avgG), avgB: Math.round(avgB), avgSat: Math.round(avgSat*100), colorVar: Math.round(colorVar) },
        textureInfo: { edgeDensity: Math.round(edgeDensity*1000)/10, texComplexity: Math.round(texComplexity*1000)/10 }
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Gagal menganalisis gambar. Silakan coba lagi.');
    } finally { setIsAnalyzing(false); }
  };

  const resetCapture = () => { setCapturedImage(null); setResult(null); setError(''); };
  const switchCamera = () => { stopCamera(); setFacingMode(prev => prev === 'environment' ? 'user' : 'environment'); };

  useEffect(() => {
    if (!isModelLoading && !capturedImage) startCamera();
    return () => stopCamera();
  }, [isModelLoading, facingMode]);

  return (
    <div className="money-detector-overlay">
      <div className="money-detector-container">
        <div className="md-header">
          <div className="md-header-left">
            <Shield size={22} />
            <div><h2>Deteksi Uang Palsu</h2><p>AI Currency Analyzer — OCR Nominal & Keaslian</p></div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="md-close-btn"><X size={22} /></button>
        </div>

        <div className="md-content">
          {isModelLoading && (
            <div className="md-loading">
              <div className="md-loading-icon"><Zap size={40} className="md-pulse" /></div>
              <h3>Memuat Model AI...</h3>
              <p>Mengunduh TensorFlow.js & MobileNet</p>
              <div className="md-progress-bar"><div className="md-progress-fill" style={{ width: `${Math.min(loadingProgress, 100)}%` }} /></div>
              <span className="md-progress-text">{Math.round(Math.min(loadingProgress, 100))}%</span>
            </div>
          )}

          {error && (
            <div className="md-error">
              <AlertTriangle size={24} /><p>{error}</p>
              <button onClick={() => { setError(''); startCamera(); }} className="md-btn md-btn-retry">Coba Lagi</button>
            </div>
          )}

          {!isModelLoading && !error && (
            <>
              <div className="md-camera-area">
                {!capturedImage ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="md-video" />
                    <div className="md-scan-overlay">
                      <div className="md-scan-corner md-tl" /><div className="md-scan-corner md-tr" />
                      <div className="md-scan-corner md-bl" /><div className="md-scan-corner md-br" />
                      <div className="md-scan-line" />
                    </div>
                    <p className="md-guide-text">Arahkan kamera ke uang kertas — pastikan pojok kiri atas terlihat jelas</p>
                  </>
                ) : (
                  <img src={capturedImage} alt="Captured" className="md-captured-img" />
                )}
              </div>

              <div className="md-actions">
                {!capturedImage ? (
                  <>
                    <button onClick={switchCamera} className="md-btn md-btn-secondary"><RotateCcw size={18} /> Ganti Kamera</button>
                    <button onClick={captureImage} className="md-btn md-btn-capture"><Camera size={20} /> Ambil Foto</button>
                  </>
                ) : (
                  <>
                    <button onClick={resetCapture} className="md-btn md-btn-secondary"><RotateCcw size={18} /> Ambil Ulang</button>
                    <button onClick={analyzeImage} className="md-btn md-btn-analyze" disabled={isAnalyzing}>
                      {isAnalyzing ? (<><Loader size={18} className="md-spin" /> Menganalisis (OCR + AI)...</>) : (<><Shield size={18} /> Analisis Keaslian</>)}
                    </button>
                  </>
                )}
              </div>

              {/* Results */}
              {result && (
                <div className={`md-results md-result-${result.verdictClass}`}>
                  {/* Denomination Card - OCR Based */}
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(199,160,122,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <Banknote size={28} style={{ color: '#C7A07A', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', marginBottom: '0.3rem' }}>Nominal Terdeteksi (OCR - Pojok Kiri Atas)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>{result.denomination?.name || 'Tidak dikenali'}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {result.denomination && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Warna: <strong style={{ color: '#e2e8f0' }}>{result.denomination?.color || '-'}</strong></span>}
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Keyakinan: <strong style={{ color: result.denomConfidence > 60 ? '#4ade80' : '#fbbf24' }}>{result.denomConfidence}%</strong></span>
                    </div>

                    {/* OCR Detail: cropped image & raw text */}
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <ScanText size={14} style={{ color: '#60a5fa' }} />
                        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa' }}>Hasil OCR Pojok Kiri Atas</span>
                      </div>
                      {result.croppedImageUrl && (
                        <div style={{ marginBottom: '0.4rem', textAlign: 'center' }}>
                          <img src={result.croppedImageUrl} alt="Area Pojok Kiri Atas" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }} />
                          <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.2rem' }}>Area yang di-scan (35% x 30% pojok kiri atas)</div>
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        Teks terbaca: <strong style={{ color: result.ocrText ? '#e2e8f0' : '#ef4444' }}>{result.ocrText || '(tidak ada teks terbaca)'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Authenticity Score */}
                  <div className="md-result-header">
                    <div className={`md-score-circle md-score-${result.verdictClass}`}>
                      <svg viewBox="0 0 100 100" className="md-score-svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeDasharray={`${result.score * 2.64} 264`} strokeLinecap="round" className="md-score-progress" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                      </svg>
                      <span className="md-score-value">{result.score}</span>
                      <span className="md-score-label">Skor</span>
                    </div>
                    <div className="md-verdict-info">
                      <div className={`md-verdict-badge md-badge-${result.verdictClass}`}>
                        {result.verdictClass === 'genuine' && <CheckCircle size={18} />}
                        {result.verdictClass === 'uncertain' && <AlertTriangle size={18} />}
                        {result.verdictClass === 'counterfeit' && <X size={18} />}
                        <span>{result.verdict}</span>
                      </div>
                      <p className="md-verdict-desc">
                        {result.verdictClass === 'genuine' && 'Karakteristik visual sesuai uang asli. Tetap verifikasi secara manual.'}
                        {result.verdictClass === 'uncertain' && 'Hasil tidak konklusif. Verifikasi di bank terdekat.'}
                        {result.verdictClass === 'counterfeit' && 'Terdeteksi anomali visual. Laporkan jika mencurigakan.'}
                      </p>
                    </div>
                  </div>

                  {/* Color & Texture Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>Warna Rata-rata</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `rgb(${result.colorInfo.avgR},${result.colorInfo.avgG},${result.colorInfo.avgB})`, border: '2px solid rgba(255,255,255,0.2)' }} />
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>R:{result.colorInfo.avgR} G:{result.colorInfo.avgG} B:{result.colorInfo.avgB}</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>Tekstur</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                        Edge: {result.textureInfo.edgeDensity}% | Detail: {result.textureInfo.texComplexity}%
                      </div>
                    </div>
                  </div>

                  <div className="md-factors">
                    <h4>Detail Analisis</h4>
                    {result.factors.map((factor, idx) => (
                      <div key={idx} className={`md-factor ${factor.positive ? 'md-factor-positive' : 'md-factor-negative'}`}>
                        <div className="md-factor-icon">{factor.positive ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}</div>
                        <span className="md-factor-label">{factor.label}</span>
                        <span className="md-factor-score">{factor.score}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="md-disclaimer">
                    <AlertTriangle size={14} />
                    <p><strong>Disclaimer:</strong> Fitur ini menggunakan AI untuk analisis visual dan bersifat estimasi. Untuk verifikasi resmi, kunjungi bank atau pihak berwenang.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={analysisCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default MoneyDetector;
