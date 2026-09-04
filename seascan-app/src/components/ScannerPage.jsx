// src/pages/ScannerPage.jsx
import React, { useState } from 'react';
import { 
  Upload, 
  Camera, 
  CheckCircle2, 
  MapPin, 
  LogIn, 
  X, 
  Leaf, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw
} from 'lucide-react';

export default function ScannerPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Toggle to simulate auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSightingDrawer, setShowSightingDrawer] = useState(false);

  // Mock upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      triggerScan();
    }
  };

  // Mock CNN identification trigger
  const triggerScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 1500);
  };

  const handleAddSighting = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setShowSightingDrawer(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            AI Species Identification
            <Sparkles className="w-6 h-6 text-teal-500" />
          </h1>
          <p className="text-slate-600 mt-1">
            Upload or capture an image of coastal vegetation to run image classification model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Image Upload & Input Area */}
          <section className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                Image Input
              </h2>

              {!selectedImage ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 transition rounded-xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-4 shadow-sm">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Drag & drop image here</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Supports JPG, PNG (Max 10MB)</p>
                  
                  <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Take Photo / Select File
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square max-h-[360px] flex items-center justify-center">
                    <img 
                      src={selectedImage} 
                      alt="Uploaded seagrass sample" 
                      className="object-cover w-full h-full"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <RefreshCw className="w-10 h-10 text-teal-400 animate-spin mb-3" />
                        <span className="font-semibold text-sm tracking-wide">Analyzing Botanical Features...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-lg text-center transition border border-slate-300 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-lg transition border border-rose-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* CNN Classification Results Card */}
          <section className="lg:col-span-7">
            {hasScanned ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                
                {/* Primary Match */}
                <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Top Match Identified
                      </span>
                      <h3 className="text-2xl font-black italic text-slate-900">
                        Enhalus acoroides
                      </h3>
                      <p className="text-sm font-medium text-slate-600">Common Name: Tropical Eelgrass</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-teal-700">94.2%</div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Confidence</span>
                    </div>
                  </div>
                </div>

                {/* Alternative Possibilities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Alternative Predictions
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="italic text-slate-700">Thalassia hemprichii</span>
                        <span className="text-slate-500">4.1%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-slate-400 h-2 rounded-full" style={{ width: '4.1%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="italic text-slate-700">Cymodocea serrulata</span>
                        <span className="text-slate-500">1.7%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-slate-400 h-2 rounded-full" style={{ width: '1.7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Botanical Attributes */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Extracted Botanical Diagnostic Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">Leaf Morphology</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">Ribbon-like, coarse</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">Margin Style</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">Entire / Smooth</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">Rhizome Type</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">Thick, fibrous mat</div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button 
                    onClick={handleAddSighting}
                    className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Add Sighting to Map
                  </button>
                </div>

              </div>
            ) : (
              /* Initial State when no image has been processed */
              <div className="bg-slate-100/70 border-2 border-dashed border-slate-200 rounded-2xl h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center">
                <Leaf className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-600">Awaiting Sample Input</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Upload an image on the left to activate the neural network and extract species details.
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Auth Guard Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <LogIn className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Authentication Required</h3>
            <p className="text-sm text-slate-600 mt-2">
              You must log in or register to log GPS location sightings to the public SeaScan database map.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button 
                onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                Log In to Account
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated GPS Capture Drawer */}
      {showSightingDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  Log GPS Sighting
                </div>
                <button onClick={() => setShowSightingDrawer(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Target Species</span>
                  <div className="font-bold italic text-slate-800">Enhalus acoroides</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Acquired Coordinates</span>
                  <div className="font-mono text-sm font-semibold text-slate-800">
                    6.9214° N, 126.2153° E
                  </div>
                  <div className="text-[11px] text-teal-600 flex items-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> High Precision GPS Fix (±3m)
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowSightingDrawer(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert("Sighting successfully logged!");
                  setShowSightingDrawer(false);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Confirm Sighting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}