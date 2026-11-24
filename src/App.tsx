import { useCallback, useEffect, useState } from 'react';
import { SidebarLayout } from './components/SidebarLayout';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useTranslationHistory } from './hooks/useTranslationHistory';
import { AboutModelPage } from './pages/AboutModelPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { HistoryPage } from './pages/HistoryPage';
import { LandingPage } from './pages/LandingPage';
import { LiveTranslatorPage } from './pages/LiveTranslatorPage';
import { OverviewPage } from './pages/OverviewPage';
import { TextToIslPage } from './pages/TextToIslPage';
import { fetchHealth, fetchModelInfo } from './services/api';
import type { HealthStatus, ModelInfoResponse, NavSection } from './types/isl';

export default function App() {
  const [section, setSection] = useState<NavSection>('landing');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const speech = useSpeechSynthesis();
  const history = useTranslationHistory();

  const refreshBackendStatus = useCallback(async () => {
    try {
      const [h, m] = await Promise.all([fetchHealth(), fetchModelInfo()]);
      setHealth(h);
      setModelInfo(m);
      if (h.fastapiConnected && h.modelLoaded) {
        setDemoMode(false);
      }
    } catch {
      setHealth({
        status: 'error',
        proxyServer: 'unreachable',
        fastapiConnected: false,
        modelLoaded: false,
        mode: 'offline',
        message: 'Unable to reach SignBridge API server.',
      });
    }
  }, []);

  useEffect(() => {
    void refreshBackendStatus();
  }, [refreshBackendStatus]);

  if (section === 'landing') {
    return <LandingPage onNavigate={setSection} />;
  }

  return (
    <SidebarLayout
      activeSection={section}
      onNavigate={setSection}
      health={health}
      onRefreshHealth={() => void refreshBackendStatus()}
      speechEnabled={speech.options.enabled}
      onToggleSpeech={() =>
        speech.setOptions((prev) => ({ ...prev, enabled: !prev.enabled }))
      }
      demoMode={demoMode && !(health?.fastapiConnected && health?.modelLoaded)}
    >
      {section === 'overview' && (
        <OverviewPage
          onNavigate={setSection}
          health={health}
          modelInfo={modelInfo}
          historyCount={history.entries.length}
          recentHistory={history.entries}
        />
      )}

      {section === 'translator' && (
        <LiveTranslatorPage
          health={health}
          demoMode={demoMode}
          onSetDemoMode={setDemoMode}
          speech={speech}
          onRecordHistory={history.addEntry}
        />
      )}

      {section === 'text-to-isl' && (
        <TextToIslPage onSpeak={(text, force) => speech.speak(text, force)} />
      )}

      {section === 'history' && (
        <HistoryPage
          entries={history.entries}
          onSpeak={(text, force) => speech.speak(text, force)}
          onRemoveEntry={history.removeEntry}
          onClearHistory={history.clearHistory}
        />
      )}

      {section === 'emergency' && (
        <EmergencyPage onSpeak={(text, force) => speech.speak(text, force)} />
      )}

      {section === 'about' && <AboutModelPage modelInfo={modelInfo} />}
    </SidebarLayout>
  );
}
