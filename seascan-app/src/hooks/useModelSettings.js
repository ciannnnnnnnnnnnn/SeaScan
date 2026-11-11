// src/hooks/useModelSettings.js
// The admin-set model settings (thresholds, server-side identification
// switch), kept up to date through Supabase Realtime. `settings` is null until
// loaded, or when the table does not exist yet (the models' own settings apply).
import { useEffect, useState } from 'react';
import { fetchModelSettings } from '../lib/api';
import { onTableChanges } from '../lib/realtime';

export function useModelSettings() {
  const [state, setState] = useState({ settings: null, loaded: false });

  useEffect(() => {
    let active = true;
    const load = () => fetchModelSettings().then((settings) => { if (active) setState({ settings, loaded: true }); });
    load();
    const stop = onTableChanges(['model_settings'], load);
    return () => { active = false; stop(); };
  }, []);

  return state;
}
