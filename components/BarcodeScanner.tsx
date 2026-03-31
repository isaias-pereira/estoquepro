
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Prefer rear camera
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // ignore errors
          }
        );
      } catch (err) {
        console.error("Unable to start scanner", err);
      }
    };

    const stopScanner = async () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (err) {
          console.error("Unable to stop scanner", err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
            <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Escanear Código
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 hover:bg-red-50 rounded-full"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div id="reader" className="overflow-hidden rounded-xl sm:rounded-2xl border-2 border-slate-100 bg-slate-900 aspect-video flex items-center justify-center">
            <div className="text-white/20 text-[10px] sm:text-xs font-bold animate-pulse">Iniciando câmera...</div>
          </div>
          <p className="text-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 sm:mt-4">
            Posicione o código de barras dentro da área demarcada
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
