import React from 'react';

interface LoadingViewProps {
  progress: number;
}

const LoadingView: React.FC<LoadingViewProps> = ({ progress }) => {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 transition-opacity duration-300">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">
          A1-302 Çeviri
        </h1>
        <p className="text-dark-text-secondary mb-6">Uygulama başlatılıyor...</p>
        <div className="w-full bg-dark-surface rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2.5 rounded-full transition-all duration-300 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;