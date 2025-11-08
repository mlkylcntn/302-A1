import React, { useState, useEffect, useCallback } from 'react';
import { TranslationItem } from './types';
import TranslateView from './TranslateView';
import FavoritesView from './FavoritesView';
import HistoryView from './HistoryView';
import SettingsView from './SettingsView';
import GameView from './GameView';
import GameAnalysisView from './GameAnalysisView';
import Toast from './Toast';
import { ICONS } from './constants';
import LoadingView from './LoadingView';

// FIX: Exporting GameResult interface to be used by GameView and GameAnalysisView, resolving module import errors.
export interface GameResult {
  item: TranslationItem;
  known: boolean | null;
}

type View = 'translate' | 'favorites' | 'history' | 'settings' | 'game' | 'game_analysis';

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

// FIX: Implemented the main App component which was missing. This orchestrates the entire application.
const App: React.FC = () => {
  const [history, setHistory] = useStickyState<TranslationItem[]>([], 'translationHistory');
  const [favorites, setFavorites] = useStickyState<TranslationItem[]>([], 'translationFavorites');
  const [autoPlayAudio, setAutoPlayAudio] = useStickyState<boolean>(false, 'autoPlayAudio');
  const [currentView, setCurrentView] = useState<View>('translate');
  const [toast, setToast] = useState('');
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading
    const timer1 = setTimeout(() => setLoadingProgress(30), 100);
    const timer2 = setTimeout(() => setLoadingProgress(70), 400);
    const timer3 = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    }, 700);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const addTranslationToHistory = useCallback((item: Omit<TranslationItem, 'id'>) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.fromText.toLowerCase() !== item.fromText.toLowerCase());
      return [{ ...item, id: new Date().toISOString() }, ...newHistory].slice(0, 50);
    });
  }, [setHistory]);

  const toggleFavorite = useCallback((item: TranslationItem) => {
    setFavorites(prev => {
      const isFavorited = prev.some(fav => fav.id === item.id);
      if (isFavorited) {
        showToast("Favorilerden kaldırıldı.");
        return prev.filter(fav => fav.id !== item.id);
      } else {
        showToast("Favorilere eklendi.");
        return [item, ...prev];
      }
    });
  }, [setFavorites, showToast]);

  const handleExportData = useCallback(() => {
    const data = JSON.stringify({ favorites, history, autoPlayAudio }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translator_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Veriler dışa aktarıldı!');
  }, [favorites, history, autoPlayAudio, showToast]);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.favorites && data.history && typeof data.autoPlayAudio === 'boolean') {
            setFavorites(data.favorites);
            setHistory(data.history);
            setAutoPlayAudio(data.autoPlayAudio);
            showToast('Veriler başarıyla içe aktarıldı!');
          } else {
            showToast('Geçersiz veri dosyası.');
          }
        } catch (error) {
          showToast('Veri dosyası okunurken hata oluştu.');
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    }
  }, [setFavorites, setHistory, setAutoPlayAudio, showToast]);


  const renderView = () => {
    switch (currentView) {
      case 'translate':
        return <TranslateView addTranslationToHistory={addTranslationToHistory} showToast={showToast} toggleFavorite={toggleFavorite} favorites={favorites} history={history} autoPlayAudio={autoPlayAudio} />;
      case 'favorites':
        return <FavoritesView favorites={favorites} setFavorites={setFavorites} showToast={showToast} onPlayGame={() => setCurrentView('game')} onToggleFavorite={toggleFavorite} />;
      case 'history':
        return <HistoryView history={history} setHistory={setHistory} showToast={showToast} />;
      case 'settings':
        return <SettingsView autoPlayAudio={autoPlayAudio} setAutoPlayAudio={setAutoPlayAudio} onExportData={handleExportData} onImportData={handleImportData} />;
      case 'game':
        return <GameView favorites={favorites} onGameEnd={(results) => { setGameResults(results); setCurrentView('game_analysis'); }} />;
      case 'game_analysis':
        return <GameAnalysisView results={gameResults} onPlayAgain={() => setCurrentView('game')} onReturnToFavorites={() => setCurrentView('favorites')} />;
      default:
        return <TranslateView addTranslationToHistory={addTranslationToHistory} showToast={showToast} toggleFavorite={toggleFavorite} favorites={favorites} history={history} autoPlayAudio={autoPlayAudio} />;
    }
  };

  if (isLoading) {
    return <LoadingView progress={loadingProgress} />;
  }

  // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const navItems: { view: View; icon: React.ReactElement; label: string }[] = [
    { view: 'translate', icon: ICONS.translate, label: 'Çevir' },
    { view: 'favorites', icon: ICONS.favorites, label: 'Favoriler' },
    { view: 'history', icon: ICONS.history, label: 'Geçmiş' },
    { view: 'settings', icon: ICONS.settings, label: 'Ayarlar' },
  ];

  return (
    <div className="bg-dark-bg text-dark-text min-h-screen flex flex-col font-sans">
      <main className="flex-grow container mx-auto px-4 py-6">
        {renderView()}
      </main>
      <nav className="sticky bottom-0 bg-dark-surface border-t border-dark-border">
        <div className="max-w-2xl mx-auto flex justify-around">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors ${
                currentView === item.view ? 'text-brand-primary' : 'text-dark-text-secondary hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {toast && <Toast message={toast} />}
    </div>
  );
};

export default App;