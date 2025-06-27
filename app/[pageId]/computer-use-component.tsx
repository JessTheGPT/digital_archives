import React, { useState, useRef, useCallback } from 'react';
import { Camera, Play, Square, Eye, Zap, Monitor, Brain, Sparkles } from 'lucide-react';

const ComputerUseWithAI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeMode, setActiveMode] = useState('analyze');
  const streamRef = useRef(null);

  const captureScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const screenshot = canvas.toDataURL('image/png');
        setCurrentScreenshot(screenshot);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Screenshot failed:', error);
      addResult('error', 'Screenshot failed. Please grant screen capture permissions.');
    }
  }, []);

  const addResult = (type, content, confidence = null) => {
    const result = {
      id: Date.now(),
      type,
      content,
      confidence,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
  };

  const analyzeWithGemini = async () => {
    if (!currentScreenshot || !prompt.trim()) {
      addResult('error', 'Please capture a screenshot and enter a prompt first.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/computer-use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          screenshot: currentScreenshot,
          action: activeMode
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult('success', data.content || data.instructions || JSON.stringify(data.actions, null, 2), data.confidence);
        
        if (data.type === 'plan' && data.actions) {
          data.actions.forEach((action, index) => {
            setTimeout(() => {
              addResult('step', `Step ${index + 1}: ${action.type} - ${action.description}`, action.confidence);
            }, index * 500);
          });
        }
      } else {
        addResult('error', data.error || 'Analysis failed');
      }
    } catch (error) {
      addResult('error', `Network error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const modes = [
    { id: 'analyze', label: 'Analyze Screen', icon: Eye, color: 'bg-blue-500', description: 'Understand what\'s on screen' },
    { id: 'plan', label: 'Plan Actions', icon: Brain, color: 'bg-purple-500', description: 'Create step-by-step plan' },
    { id: 'execute', label: 'Execute Task', icon: Zap, color: 'bg-green-500', description: 'Get execution instructions' }
  ];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'success': return <Sparkles className="w-4 h-4 text-green-500" />;
      case 'error': return <Square className="w-4 h-4 text-red-500" />;
      case 'step': return <Play className="w-4 h-4 text-blue-500" />;
      default: return <Monitor className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Brain className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Computer Use with Gemini AI
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Let AI see and understand your screen to automate tasks</p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                activeMode === mode.id
                  ? 'border-white bg-white/10 scale-105'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 ${mode.color} rounded-lg`}>
                  <mode.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold">{mode.label}</span>
              </div>
              <p className="text-sm text-gray-400 text-left">{mode.description}</p>
            </button>
          ))}
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Screenshot Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Screen Capture
              </h3>
              
              <button
                onClick={captureScreenshot}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Screenshot
              </button>

              {currentScreenshot && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <img 
                    src={currentScreenshot} 
                    alt="Screenshot" 
                    className="w-full h-32 object-contain rounded border border-gray-600"
                  />
                  <p className="text-sm text-green-400 mt-2">✓ Screenshot captured</p>
                </div>
              )}
            </div>

            {/* Prompt Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">AI Prompt</h3>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Enter your ${activeMode} request... (e.g., "Find the search button and click it", "Plan steps to create a new document", "Help me navigate to the settings page")`}
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                onClick={analyzeWithGemini}
                disabled={isAnalyzing || !currentScreenshot || !prompt.trim()}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {modes.find(m => m.id === activeMode)?.label}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              AI Results
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Capture a screenshot and enter a prompt to get started</p>
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.type === 'error' 
                        ? 'bg-red-900/20 border-red-700' 
                        : result.type === 'success'
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getResultIcon(result.type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-300">
                            {result.timestamp}
                          </span>
                          {result.confidence && (
                            <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                              {Math.round(result.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {result.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">How to Use:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong>1. Capture:</strong> Click "Capture Screenshot" and select the screen/window you want to analyze
            </div>
            <div>
              <strong>2. Prompt:</strong> Describe what you want to accomplish or analyze
            </div>
            <div>
              <strong>3. Analyze:</strong> Choose your mode and let Gemini AI understand and help
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComputerUseWithAI;