// src/lib/realtime.js
// Supabase Realtime: run a callback when rows of the given tables change.
// Row Level Security still applies, so each user only hears about rows they
// may read. Changes that arrive together are handled once (debounced).
import { supabase } from '../supabaseClient';

let counter = 0;

/** Returns a function that stops listening. */
export function onTableChanges(tables, callback, { debounceMs = 400 } = {}) {
  let timer = null;
  const fire = () => {
    clearTimeout(timer);
    timer = setTimeout(callback, debounceMs);
  };

  let channel = supabase.channel(`seascan-${tables.join('-')}-${++counter}`);
  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, fire);
  }
  channel.subscribe();

  return () => {
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}
