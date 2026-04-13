import React, { useState, useRef } from 'react';
import { Upload, Activity, AlertCircle, CheckCircle2, ChevronRight, Info } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setResult(null);
    
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // In production, this should point to your hosted completely backend URL
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <Activity className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Psoriasis Analysis
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Upload a skin image for AI-powered fast preliminary screening.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 transition-all">
          
          <div className="p-8">
            
            {/* Upload Area */}
            {!preview ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 pt-10 pb-12 transition hover:border-primary-500 hover:bg-slate-50"
              >
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="text-sm text-slate-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} accept="image/*" />
                    </label>
                    <p className="pl-1 inline">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, JPEG up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Preview area */}
                <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2 flex justify-center">
                  <img src={preview} alt="Preview" className="max-h-80 object-contain rounded-lg shadow-sm" />
                  {!loading && !result && (
                     <button
                       onClick={clearSelection}
                       className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-sm font-medium shadow hover:bg-white transition"
                     >
                       Change Image
                     </button>
                  )}
                </div>

                {/* Status / Action area */}
                <div className="flex flex-col items-center space-y-4">
                  {error && (
                    <div className="w-full bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                      <AlertCircle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-medium">Analysis Failed</h3>
                        <p className="text-sm mt-1 text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="w-full text-center space-y-4 py-8">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary-600"></div>
                      <p className="text-slate-600 font-medium">Analyzing neural patterns...</p>
                    </div>
                  ) : result ? (
                    <div className="w-full animate-fade-in-up">
                      <div className={`p-6 rounded-xl border ${result.prediction === 'Psoriasis' ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">Analysis Result</h3>
                          {result.prediction === 'Psoriasis' ? 
                            <AlertCircle className="h-6 w-6 text-orange-600" /> : 
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          }
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Prediction</p>
                            <p className={`text-3xl font-bold mt-1 ${result.prediction === 'Psoriasis' ? 'text-orange-700' : 'text-emerald-700'}`}>
                              {result.prediction}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-end mb-1 mt-6">
                              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Confidence Score</p>
                              <span className="text-lg font-bold text-slate-700">{result.confidence}%</span>
                            </div>
                            <div className="w-full bg-black/10 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-1000 ease-out ${result.prediction === 'Psoriasis' ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${result.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                      </div>
                      
                      <button
                        onClick={clearSelection}
                        className="mt-6 w-full py-3 px-4 border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
                      >
                        Analyze Another Image
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handlePredict}
                      className="w-full py-4 px-6 border border-transparent rounded-lg shadow-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-lg font-medium transition flex justify-center items-center group"
                    >
                      Run AI Analysis
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>
          
          <div className="bg-slate-100/50 px-8 py-5 border-t border-slate-100 flex items-start sm:items-center">
            <Info className="h-5 w-5 text-slate-400 mt-0.5 sm:mt-0 mr-3 shrink-0" />
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              <span className="font-semibold text-slate-700">Disclaimer:</span> This is not a medical diagnosis. The AI model provides a preliminary screening based on visual patterns. Always consult with a qualified dermatologist or healthcare professional for an accurate diagnosis and appropriate treatment.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;
