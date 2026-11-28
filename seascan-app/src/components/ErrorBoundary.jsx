// src/components/ErrorBoundary.jsx
// Catches a crash inside one part of the app (a page or a portal section) and
// shows a small error card there, so the header, menus and other sections keep
// working. Give it a `resetKey` (e.g. the current path or tab): when it changes
// the section is tried again automatically.
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  // A new resetKey (another page or tab) clears the error, so it is tried again.
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error('SeaScan: a section stopped working.', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="m-4 sm:m-8 max-w-xl mx-auto p-6 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-3 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto" />
        <h2 className="text-base font-bold text-white">This part of SeaScan ran into a problem</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The rest of the system still works. Try this section again, or go to another page from the menu.
          Nothing you already saved was lost.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button type="button" onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          {this.props.showHomeLink !== false && (
            <Link to="/" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors">
              Go to Home
            </Link>
          )}
        </div>
      </div>
    );
  }
}
