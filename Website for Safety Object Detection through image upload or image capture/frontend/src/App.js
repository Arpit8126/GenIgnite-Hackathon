import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [outputImage, setOutputImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const fileInputRef = useRef();

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setLoading(true);
    setImage(file);
    setOutputImage(null);
    setDetections([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/detect/', formData, {
        timeout: 30000
      });
      setDetections(response.data.detections || []);
      setOutputImage(`data:image/jpeg;base64,${response.data.image_base64}`);
    } catch (error) {
      console.error('Detection error:', error);
      alert('Failed to detect objects. Please check if the backend server is running.');
      setDetections([]);
      setOutputImage(null);
    } finally {
      setLoading(false);
    }
  };

  // File input change handler
  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) handleImageUpload(file);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      alert('Camera access denied. Please allow camera permission.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
      handleImageUpload(file);
      setCameraActive(false);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Professional Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
        
        {/* Minimal Accent Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight">
            Safety Object Detection AI
          </h1>
          <div className="w-32 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-8"></div>
          <p className="text-2xl md:text-3xl text-slate-300 font-light mb-6">
            Professional Object Detection System
          </p>
          <p className="text-lg text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Advanced AI-powered safety equipment detection for industrial and space station environments
          </p>
        </div>

        {/* Upload Section */}
        <div className="w-full max-w-8xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* File Upload Card */}
            <div className="group">
              <div
                className={`bg-slate-900/60 border border-slate-600 rounded-2xl p-12 text-center transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 cursor-pointer min-h-[480px] flex flex-col justify-center ${
                  dragActive ? 'border-blue-500 bg-slate-900/80' : ''
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">Upload Image</h3>
                <p className="text-lg text-slate-300 mb-6">Click to browse or drag and drop</p>
                <p className="text-base text-slate-400 mb-6">Supports JPG, PNG, WebP formats</p>
                
                {image && (
                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-emerald-400 text-base">✓ {image.name} uploaded successfully</p>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Card */}
            <div className="group">
              <div className="bg-slate-900/60 border border-slate-600 rounded-2xl p-12 text-center transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/80 min-h-[480px] flex flex-col justify-center">
                
                {!cameraActive ? (
                  <>
                    <div className="mb-8">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-white mb-4">Live Camera</h3>
                    <p className="text-lg text-slate-300 mb-6">Capture images in real-time</p>
                    <p className="text-base text-slate-400 mb-6">Real-time AI detection</p>
                    
                    <button
                      onClick={startCamera}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all duration-200"
                    >
                      Start Camera
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-lg mx-auto rounded-xl border border-slate-600"
                    />
                    <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                    
                    <div className="flex gap-6 justify-center">
                      <button
                        onClick={capturePhoto}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors duration-200"
                      >
                        Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors duration-200"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="mb-16 text-center">
            <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-medium text-white mb-3">Processing Image</p>
            <p className="text-lg text-slate-400">AI analysis in progress...</p>
          </div>
        )}

        {/* Results Section */}
        {outputImage && (
          <div className="w-full max-w-8xl mx-auto space-y-12">
            
            {/* Results Header */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Detection Results
              </h2>
              <div className="flex items-center justify-center gap-8 text-base">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-3">
                  <span className="text-emerald-400 font-medium">{detections.length} objects detected</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-6 py-3">
                  <span className="text-blue-400 font-medium">Analysis Complete</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              
              {/* Result Image */}
              <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl p-8 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="w-4 h-4 bg-emerald-400 rounded-full mr-4"></span>
                  Processed Image
                </h3>
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={outputImage}
                    alt="Detection Result"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>

              {/* Detection Details */}
              <div className="lg:col-span-1 bg-slate-900/40 rounded-2xl p-8 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-8 flex items-center">
                  <span className="w-4 h-4 bg-blue-400 rounded-full mr-4"></span>
                  Object Analysis
                </h3>

                {detections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14Z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-3">No Objects Detected</h4>
                    <p className="text-slate-400 mb-6">Try uploading an image with safety equipment:</p>
                    <div className="grid grid-cols-1 gap-3 text-base text-slate-400">
                      <div>• Oxygen Tank</div>
                      <div>• Fire Extinguisher</div>
                      <div>• First Aid Box</div>
                      <div>• Safety Switch Panel</div>
                      <div>• Emergency Phone</div>
                      <div>• Nitrogen Tank</div>
                      <div>• Fire Alarm</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {detections.map((detection, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 border border-slate-600 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-emerald-400 rounded-full mr-4"></div>
                            <h4 className="text-lg font-semibold text-white">{detection.class_name}</h4>
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-base font-medium">
                            {(detection.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                          <p className="text-slate-300 text-base font-mono">
                            <span className="text-blue-400">Normalized Position:</span> [
                            {detection.norm_x1?.toFixed(3) || (detection.x1/1000).toFixed(3)}, 
                            {detection.norm_y1?.toFixed(3) || (detection.y1/1000).toFixed(3)}, 
                            {detection.norm_x2?.toFixed(3) || (detection.x2/1000).toFixed(3)}, 
                            {detection.norm_y2?.toFixed(3) || (detection.y2/1000).toFixed(3)}]
                          </p>
                          <p className="text-slate-500 text-sm mt-2">
                            Range: (0,0) = top-left, (1,1) = bottom-right
                          </p>
                        </div>
                        
                        {/* Confidence Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-base">
                            <span className="text-slate-400">Confidence Level</span>
                            <span className="text-white font-medium">{(detection.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-700"
                              style={{ width: `${detection.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-lg text-slate-500">
            © 2025 Neural Vision AI • Professional Object Detection Technology
          </p>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
}

export default App;
