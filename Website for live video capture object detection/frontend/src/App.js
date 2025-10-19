// App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const [outputImage, setOutputImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [detectionCount, setDetectionCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [averageAccuracy, setAverageAccuracy] = useState(0);
  const videoRef = useRef();
  const canvasRef = useRef();
  const wsRef = useRef();
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - fpsCounterRef.current.lastTime) / 1000;
      if (elapsed >= 1) {
        setFps(Math.round(fpsCounterRef.current.frames / elapsed));
        fpsCounterRef.current = { frames: 0, lastTime: now };
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "environment" } 
      });
      videoRef.current.srcObject = stream;

      const ws = new WebSocket("ws://localhost:8000/ws");
      
      ws.onopen = () => {
        setConnectionStatus("connected");
        setIsLoading(false);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setOutputImage("data:image/jpeg;base64," + data.image);
          setDetectedObjects(data.detections || []);
          
          // Calculate average accuracy from detections
          if (data.detections && data.detections.length > 0) {
            const avgConf = data.detections.reduce((sum, det) => sum + det.confidence, 0) / data.detections.length;
            setAverageAccuracy(Math.round(avgConf * 100));
          } else {
            setAverageAccuracy(0);
          }
          
          fpsCounterRef.current.frames++;
          setDetectionCount(prev => prev + 1);
        } catch (e) {
          // Fallback for old format
          setOutputImage("data:image/jpeg;base64," + evt.data);
          fpsCounterRef.current.frames++;
          setDetectionCount(prev => prev + 1);
        }
      };

      ws.onerror = () => {
        setConnectionStatus("error");
        setIsLoading(false);
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
      };

      wsRef.current = ws;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const intervalId = setInterval(() => {
        if(videoRef.current && ws.readyState === WebSocket.OPEN){
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
          ws.send(data);
        }
      }, 50); // 20 FPS for better performance and less delay

      videoRef.current._intervalId = intervalId;

    } catch (error) {
      alert("Camera access denied. Please enable camera permissions.");
      setCameraActive(false);
      setIsLoading(false);
      setConnectionStatus("disconnected");
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    setConnectionStatus("disconnected");
    setDetectionCount(0);
    setFps(0);
    setDetectedObjects([]);
    setAverageAccuracy(0);
    if(videoRef.current?.srcObject){
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if(videoRef.current?._intervalId){
      clearInterval(videoRef.current._intervalId);
    }
    if(wsRef.current){
      wsRef.current.close();
    }
  };

  const safetyObjects = [
    { name: "Fire Extinguisher", icon: "🧯" },
    { name: "First Aid Box", icon: "🏥" },
    { name: "Fire Alarm", icon: "🔔" },
    { name: "Oxygen Tank", icon: "🫁" },
    { name: "Nitrogen Tank", icon: "⚗️" },
    { name: "Safety Switch Panel", icon: "🔌" },
    { name: "Emergency Phone", icon: "📞" }
  ];

  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="main-content">
        {!cameraActive ? (
          <div className="welcome-screen">
            <div className="icon-wrapper">
              <span className="main-icon">📹</span>
              <div className="pulse-ring"></div>
            </div>
            
            <h2 className="welcome-title">AI-Powered Safety Detection</h2>
            <p className="welcome-description">
              Our advanced AI system detects and identifies critical safety equipment in real-time, 
              ensuring workplace compliance and safety standards.
            </p>

            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">Real-time Detection</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span className="feature-text">High Accuracy</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span className="feature-text">Secure & Private</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span className="feature-text">Live Analytics</span>
              </div>
            </div>

            <button
              onClick={startCamera}
              disabled={isLoading}
              className="start-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Initializing Camera...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">📹</span>
                  <span>Start Detection</span>
                </>
              )}
            </button>

            <div className="detectable-objects">
              <h3 className="objects-title">Detectable Safety Equipment</h3>
              <div className="objects-list">
                {safetyObjects.map((obj, idx) => (
                  <div key={idx} className="object-chip">
                    <span className="object-icon">{obj.icon}</span>
                    <span className="object-name">{obj.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="detection-screen">
            <div className="detection-layout">
              <div className="video-section">
                <div className="video-header">
                  <div className="video-title">
                    <span className="title-icon">🛡️</span>
                    <span>SafetyVision AI</span>
                  </div>
                  <div className="status-indicators">
                    <div className={`status-badge ${connectionStatus}`}>
                      <span className="status-dot"></span>
                      {connectionStatus === "connected" ? "Live" : 
                       connectionStatus === "error" ? "Error" : "Offline"}
                    </div>
                    <div className="fps-counter">
                      <span className="fps-label">FPS:</span>
                      <span className="fps-value">{fps}</span>
                    </div>
                  </div>
                </div>

                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    width="1280"
                    height="720"
                    className="video-feed hidden"
                  />
                  <canvas ref={canvasRef} width="1280" height="720" className="hidden" />
                  
                  {outputImage ? (
                    <div className="output-wrapper">
                      <img
                        src={outputImage}
                        alt="Detection Result"
                        className="detection-output"
                      />
                      <div className="scan-line"></div>
                      <div className="corner-tl"></div>
                      <div className="corner-tr"></div>
                      <div className="corner-bl"></div>
                      <div className="corner-br"></div>
                    </div>
                  ) : (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                      <p>Processing video feed...</p>
                    </div>
                  )}
                </div>

                <div className="stats-bar">
                  <div className="stat-item">
                    <span className="stat-icon">📊</span>
                    <div className="stat-content">
                      <span className="stat-label">Frames Processed</span>
                      <span className="stat-value">{detectionCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⚡</span>
                    <div className="stat-content">
                      <span className="stat-label">Processing Speed</span>
                      <span className="stat-value">{fps} FPS</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🎯</span>
                    <div className="stat-content">
                      <span className="stat-label">Average Confidence</span>
                      <span className="stat-value">{averageAccuracy}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={stopCamera}
                  className="stop-button"
                >
                  <span className="button-icon">⏹️</span>
                  <span>Stop Detection</span>
                </button>
              </div>

              <div className="detection-sidebar">
                <div className="sidebar-header">
                  <h3 className="sidebar-title">🎯 Detected Objects</h3>
                  <span className="detection-badge">
                    {detectedObjects.length} Active
                  </span>
                </div>

                <div className="detected-list">
                  {detectedObjects.length > 0 ? (
                    detectedObjects.map((obj, idx) => (
                      <div key={idx} className="detected-item">
                        <div className="detected-item-header">
                          <span className="detected-icon">
                            {obj.class_name === "FireExtinguisher" ? "🧯" :
                             obj.class_name === "FirstAidBox" ? "🏥" :
                             obj.class_name === "FireAlarm" ? "🔔" :
                             obj.class_name === "OxygenTank" ? "🫁" :
                             obj.class_name === "NitrogenTank" ? "⚗️" :
                             obj.class_name === "SafetySwitchPanel" ? "🔌" :
                             obj.class_name === "EmergencyPhone" ? "📞" : "📦"}
                          </span>
                          <span className="detected-name">
                            {obj.class_name.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <div className="confidence-bar-container">
                          <div className="confidence-bar-bg">
                            <div 
                              className="confidence-bar-fill" 
                              style={{ width: `${obj.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="confidence-text">
                            {Math.round(obj.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-detections">
                      <span className="no-detections-icon">🔍</span>
                      <p className="no-detections-text">No objects detected yet</p>
                      <p className="no-detections-hint">Point camera at safety equipment</p>
                    </div>
                  )}
                </div>

                <div className="sidebar-footer">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#22c55e' }}></div>
                    <span>High (&gt;80%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#eab308' }}></div>
                    <span>Medium (50-80%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#ef4444' }}></div>
                    <span>Low (&lt;50%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
