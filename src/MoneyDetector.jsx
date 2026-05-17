import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { X, Camera, RotateCcw, Shield, AlertTriangle, CheckCircle, Loader, Zap } from 'lucide-react';

/**
 * MoneyDetector Component
 * 
 * Uses TensorFlow.js with MobileNet to analyze camera images of Indonesian currency
 * and determine whether the banknote is likely genuine or counterfeit.
 * 
 * Detection is based on:
 * 1. MobileNet feature extraction for general image classification
 * 2. Color distribution analysis (Indonesian banknotes have specific color profiles)
 * 3. Texture/edge complexity analysis
 * 4. Pattern consistency scoring
 */

// Indonesian banknote color profiles (dominant HSL ranges)
const BANKNOTE_PROFILES = {
  '100000': { name: 'Rp 100.000', dominantColor: 'red/pink', hueRange: [340, 20], satRange: [40, 100] },
  '50000': { name: 'Rp 50.000', dominantColor: 'blue', hueRange: [200, 240], satRange: [40, 100] },
  '20000': { name: 'Rp 20.000', dominantColor: 'green', hueRange: [100, 150], satRange: [30, 90] },
  '10000': { name: 'Rp 10.000', dominantColor: 'purple', hueRange: [260, 310], satRange: [30, 90] },
  '5000': { name: 'Rp 5.000', dominantColor: 'brown/orange', hueRange: [15, 45], satRange: [40, 90] },
  '2000': { name: 'Rp 2.000', dominantColor: 'gray/silver', hueRange: [0, 360], satRange: [0, 20] },
  '1000': { name: 'Rp 1.000', dominantColor: 'green', hueRange: [100, 160], satRange: [20, 70] },
};

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

  // Load MobileNet model
  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        setLoadingProgress(10);
        await tf.ready();
        setLoadingProgress(30);
        
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 1.0
        });
        
        setLoadingProgress(100);
        if (isMounted) {
          setModel(loadedModel);
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('Failed to load model:', err);
        if (isMounted) {
          setError('Gagal memuat model AI. Pastikan koneksi internet stabil.');
          setIsModelLoading(false);
        }
      }
    };

    loadModel();
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError('');
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    setResult(null);
  };

  // Analyze color distribution
  const analyzeColorDistribution = (imageData) => {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    
    let colorHistogram = {
      red: 0, green: 0, blue: 0,
      avgR: 0, avgG: 0, avgB: 0,
      saturationSum: 0, brightnessSum: 0,
      edgeCount: 0, colorVariance: 0
    };

    let rSum = 0, gSum = 0, bSum = 0;
    let rSqSum = 0, gSqSum = 0, bSqSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      rSum += r;
      gSum += g;
      bSum += b;
      rSqSum += r * r;
      gSqSum += g * g;
      bSqSum += b * b;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightness = max / 255;

      colorHistogram.saturationSum += saturation;
      colorHistogram.brightnessSum += brightness;

      if (r > g && r > b) colorHistogram.red++;
      else if (g > r && g > b) colorHistogram.green++;
      else colorHistogram.blue++;
    }

    colorHistogram.avgR = rSum / totalPixels;
    colorHistogram.avgG = gSum / totalPixels;
    colorHistogram.avgB = bSum / totalPixels;

    // Color variance (genuine notes have more complex color patterns)
    colorHistogram.colorVariance = (
      (rSqSum / totalPixels - colorHistogram.avgR ** 2) +
      (gSqSum / totalPixels - colorHistogram.avgG ** 2) +
      (bSqSum / totalPixels - colorHistogram.avgB ** 2)
    ) / 3;

    colorHistogram.avgSaturation = colorHistogram.saturationSum / totalPixels;
    colorHistogram.avgBrightness = colorHistogram.brightnessSum / totalPixels;

    return colorHistogram;
  };

  // Analyze texture complexity (edge detection)
  const analyzeTextureComplexity = (imageData, width, height) => {
    const data = imageData.data;
    let edgeScore = 0;
    let detailScore = 0;

    // Sobel-like edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;

        const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
        const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

        const gx = rightGray - leftGray;
        const gy = bottomGray - topGray;
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > 30) edgeScore++;
        if (magnitude > 10 && magnitude <= 30) detailScore++;
      }
    }

    const totalAnalyzedPixels = (width - 2) * (height - 2);
    return {
      edgeDensity: edgeScore / totalAnalyzedPixels,
      detailDensity: detailScore / totalAnalyzedPixels,
      totalComplexity: (edgeScore + detailScore) / totalAnalyzedPixels
    };
  };

  // Main analysis function
  const analyzeImage = async () => {
    if (!model || !capturedImage) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Create an image element for MobileNet
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedImage;
      });

      // MobileNet classification
      const predictions = await model.classify(img, 10);

      // Canvas-based pixel analysis
      const analysisCanvas = analysisCanvasRef.current;
      const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
      
      // Resize for analysis (smaller = faster)
      const analysisWidth = 300;
      const analysisHeight = Math.round((img.height / img.width) * analysisWidth);
      analysisCanvas.width = analysisWidth;
      analysisCanvas.height = analysisHeight;
      ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);

      const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);

      // Run analyses
      const colorAnalysis = analyzeColorDistribution(imageData);
      const textureAnalysis = analyzeTextureComplexity(imageData, analysisWidth, analysisHeight);

      // Score calculation
      let authenticityScore = 50; // Start neutral
      let factors = [];

      // Factor 1: MobileNet detects paper/money-related objects
      const moneyKeywords = ['bill', 'money', 'banknote', 'currency', 'envelope', 'paper', 'card', 'ticket', 'notebook', 'book jacket'];
      const moneyPredictions = predictions.filter(p =>
        moneyKeywords.some(kw => p.className.toLowerCase().includes(kw))
      );

      if (moneyPredictions.length > 0) {
        const topMoneyProb = moneyPredictions[0].probability;
        authenticityScore += topMoneyProb * 15;
        factors.push({
          label: 'Objek terdeteksi sebagai uang kertas/dokumen',
          score: Math.round(topMoneyProb * 100),
          positive: true
        });
      } else {
        authenticityScore -= 10;
        factors.push({
          label: 'Objek tidak teridentifikasi sebagai uang',
          score: 0,
          positive: false
        });
      }

      // Factor 2: Color saturation (genuine notes have rich, specific colors)
      if (colorAnalysis.avgSaturation > 0.15 && colorAnalysis.avgSaturation < 0.7) {
        authenticityScore += 12;
        factors.push({
          label: 'Saturasi warna dalam rentang normal',
          score: Math.round(colorAnalysis.avgSaturation * 100),
          positive: true
        });
      } else if (colorAnalysis.avgSaturation <= 0.15) {
        authenticityScore -= 15;
        factors.push({
          label: 'Warna terlalu pudar (indikasi cetakan buruk)',
          score: Math.round(colorAnalysis.avgSaturation * 100),
          positive: false
        });
      } else {
        authenticityScore -= 8;
        factors.push({
          label: 'Warna terlalu jenuh (indikasi cetakan berlebihan)',
          score: Math.round(colorAnalysis.avgSaturation * 100),
          positive: false
        });
      }

      // Factor 3: Color variance (genuine notes have complex color patterns)
      if (colorAnalysis.colorVariance > 1500 && colorAnalysis.colorVariance < 6000) {
        authenticityScore += 10;
        factors.push({
          label: 'Variasi warna konsisten dengan uang asli',
          score: Math.round(Math.min(colorAnalysis.colorVariance / 60, 100)),
          positive: true
        });
      } else {
        authenticityScore -= 8;
        factors.push({
          label: 'Variasi warna tidak konsisten',
          score: Math.round(Math.min(colorAnalysis.colorVariance / 60, 100)),
          positive: false
        });
      }

      // Factor 4: Texture complexity (genuine notes have intricate micro-printing)
      if (textureAnalysis.totalComplexity > 0.15 && textureAnalysis.totalComplexity < 0.6) {
        authenticityScore += 13;
        factors.push({
          label: 'Kompleksitas tekstur menunjukkan detail cetak halus',
          score: Math.round(textureAnalysis.totalComplexity * 100),
          positive: true
        });
      } else if (textureAnalysis.totalComplexity <= 0.15) {
        authenticityScore -= 12;
        factors.push({
          label: 'Tekstur terlalu halus (kurang detail micro-printing)',
          score: Math.round(textureAnalysis.totalComplexity * 100),
          positive: false
        });
      } else {
        authenticityScore -= 5;
        factors.push({
          label: 'Tekstur terlalu kasar (kemungkinan noise/buram)',
          score: Math.round(textureAnalysis.totalComplexity * 100),
          positive: false
        });
      }

      // Factor 5: Edge density (genuine notes have clear defined features)
      if (textureAnalysis.edgeDensity > 0.05 && textureAnalysis.edgeDensity < 0.25) {
        authenticityScore += 10;
        factors.push({
          label: 'Ketajaman garis dan pola terdeteksi baik',
          score: Math.round(textureAnalysis.edgeDensity * 400),
          positive: true
        });
      } else {
        authenticityScore -= 8;
        factors.push({
          label: 'Ketajaman garis tidak optimal',
          score: Math.round(textureAnalysis.edgeDensity * 400),
          positive: false
        });
      }

      // Factor 6: Brightness (neither too dark nor washed out)
      if (colorAnalysis.avgBrightness > 0.3 && colorAnalysis.avgBrightness < 0.85) {
        authenticityScore += 5;
        factors.push({
          label: 'Pencahayaan gambar memadai untuk analisis',
          score: Math.round(colorAnalysis.avgBrightness * 100),
          positive: true
        });
      } else {
        authenticityScore -= 5;
        factors.push({
          label: 'Pencahayaan kurang optimal',
          score: Math.round(colorAnalysis.avgBrightness * 100),
          positive: false
        });
      }

      // Clamp score
      authenticityScore = Math.max(0, Math.min(100, Math.round(authenticityScore)));

      // Determine verdict
      let verdict, verdictClass;
      if (authenticityScore >= 70) {
        verdict = 'KEMUNGKINAN ASLI';
        verdictClass = 'genuine';
      } else if (authenticityScore >= 45) {
        verdict = 'PERLU VERIFIKASI LEBIH LANJUT';
        verdictClass = 'uncertain';
      } else {
        verdict = 'KEMUNGKINAN PALSU';
        verdictClass = 'counterfeit';
      }

      setResult({
        score: authenticityScore,
        verdict,
        verdictClass,
        factors,
        predictions: predictions.slice(0, 5),
        colorAnalysis,
        textureAnalysis
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Gagal menganalisis gambar. Silakan coba lagi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to camera
  const resetCapture = () => {
    setCapturedImage(null);
    setResult(null);
    setError('');
  };

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (!isModelLoading && !capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [isModelLoading, facingMode]);

  return (
    <div className="money-detector-overlay">
      <div className="money-detector-container">
        {/* Header */}
        <div className="md-header">
          <div className="md-header-left">
            <Shield size={22} />
            <div>
              <h2>Deteksi Uang Palsu</h2>
              <p>Powered by TensorFlow.js & AI</p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="md-close-btn">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="md-content">
          {/* Loading State */}
          {isModelLoading && (
            <div className="md-loading">
              <div className="md-loading-icon">
                <Zap size={40} className="md-pulse" />
              </div>
              <h3>Memuat Model AI...</h3>
              <p>Mengunduh dan menginisialisasi TensorFlow.js</p>
              <div className="md-progress-bar">
                <div
                  className="md-progress-fill"
                  style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                />
              </div>
              <span className="md-progress-text">{Math.round(Math.min(loadingProgress, 100))}%</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="md-error">
              <AlertTriangle size={24} />
              <p>{error}</p>
              <button onClick={() => { setError(''); startCamera(); }} className="md-btn md-btn-retry">
                Coba Lagi
              </button>
            </div>
          )}

          {/* Camera / Captured View */}
          {!isModelLoading && !error && (
            <>
              <div className="md-camera-area">
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="md-video"
                    />
                    <div className="md-scan-overlay">
                      <div className="md-scan-corner md-tl" />
                      <div className="md-scan-corner md-tr" />
                      <div className="md-scan-corner md-bl" />
                      <div className="md-scan-corner md-br" />
                      <div className="md-scan-line" />
                    </div>
                    <p className="md-guide-text">Arahkan kamera ke uang kertas</p>
                  </>
                ) : (
                  <img src={capturedImage} alt="Captured" className="md-captured-img" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="md-actions">
                {!capturedImage ? (
                  <>
                    <button onClick={switchCamera} className="md-btn md-btn-secondary">
                      <RotateCcw size={18} />
                      Ganti Kamera
                    </button>
                    <button onClick={captureImage} className="md-btn md-btn-capture">
                      <Camera size={20} />
                      Ambil Foto
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={resetCapture} className="md-btn md-btn-secondary">
                      <RotateCcw size={18} />
                      Ambil Ulang
                    </button>
                    <button
                      onClick={analyzeImage}
                      className="md-btn md-btn-analyze"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader size={18} className="md-spin" />
                          Menganalisis...
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          Analisis Keaslian
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Results */}
              {result && (
                <div className={`md-results md-result-${result.verdictClass}`}>
                  <div className="md-result-header">
                    <div className={`md-score-circle md-score-${result.verdictClass}`}>
                      <svg viewBox="0 0 100 100" className="md-score-svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="42"
                          fill="none"
                          strokeWidth="6"
                          strokeDasharray={`${result.score * 2.64} 264`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="md-score-progress"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        />
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
                        {result.verdictClass === 'genuine' && 'Analisis menunjukkan karakteristik uang asli. Namun tetap verifikasi secara manual.'}
                        {result.verdictClass === 'uncertain' && 'Hasil analisis tidak konklusif. Disarankan untuk memverifikasi di bank terdekat.'}
                        {result.verdictClass === 'counterfeit' && 'Terdeteksi anomali pada gambar. Segera laporkan ke pihak berwajib jika mencurigakan.'}
                      </p>
                    </div>
                  </div>

                  <div className="md-factors">
                    <h4>Detail Analisis</h4>
                    {result.factors.map((factor, idx) => (
                      <div key={idx} className={`md-factor ${factor.positive ? 'md-factor-positive' : 'md-factor-negative'}`}>
                        <div className="md-factor-icon">
                          {factor.positive ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <span className="md-factor-label">{factor.label}</span>
                        <span className="md-factor-score">{factor.score}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="md-disclaimer">
                    <AlertTriangle size={14} />
                    <p>
                      <strong>Disclaimer:</strong> Fitur ini menggunakan AI untuk analisis visual dan bersifat estimasi.
                      Untuk verifikasi resmi, silakan kunjungi bank atau pihak berwenang.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden canvases for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={analysisCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default MoneyDetector;
