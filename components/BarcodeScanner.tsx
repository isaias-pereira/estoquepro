
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        // Try with environment facing mode first
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 150 },
              aspectRatio: 1.777778
            },
            (decodedText) => {
              onScan(decodedText);
              stopScanner();
            },
            () => {}
          );
        } catch (firstErr) {
          console.warn("Failed to start with environment camera, trying default", firstErr);
          // Fallback to any available camera
          await html5QrCode.start(
            undefined as any,
            {
              fps: 10,
              qrbox: { width: 250, height: 150 },
              aspectRatio: 1.777778
            },
            (decodedText) => {
              onScan(decodedText);
              stopScanner();
            },
            () => {}
          );
        }
      } catch (err: any) {
        console.error("Unable to start scanner", err);
        const errStr = err?.toString() || "";
        if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
          setError("Permissão de câmera negada. Se você estiver usando o app dentro de uma janela de visualização, tente abrir em uma 'Nova Aba' para permitir o acesso.");
        } else if (errStr.includes("NotFoundError")) {
          setError("Nenhuma câmera encontrada neste dispositivo.");
        } else {
          setError("Não foi possível iniciar a câmera. Verifique se ela está sendo usada por outro aplicativo ou se o site tem permissão.");
        }
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
            <Camera className="w-4 h-4 mr-2 text-indigo-600" />
            Escanear Código
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 hover:bg-red-50 rounded-full"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div id="reader" className="overflow-hidden rounded-xl sm:rounded-2xl border-2 border-slate-100 bg-slate-900 aspect-video flex flex-col items-center justify-center p-4">
            {!error ? (
              <div className="text-white/20 text-[10px] sm:text-xs font-bold animate-pulse">Iniciando câmera...</div>
            ) : (
              <div className="text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-red-400 text-[10px] sm:text-xs font-bold leading-relaxed">
                  {error}
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-white/10 hover:bg-white/20 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg"
                  >
                    Abrir em Nova Aba
                  </button>
                </div>
              </div>
            )}
          </div>
          {!error && (
            <p className="text-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 sm:mt-4">
              Posicione o código de barras dentro da área demarcada
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
