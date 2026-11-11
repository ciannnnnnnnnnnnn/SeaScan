// src/components/staff/Inboxes.jsx
// Feedback from the Help page and questions from the Community portal.
import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Inbox, Trash2, Send, Download } from 'lucide-react';
import { fetchFeedback, deleteFeedback, fetchAllQuestions, answerQuestion, deleteQuestion, downloadCsv } from '../../lib/api';
import { Panel, Alert, buttonClass, inputClass } from './PortalShell';
import { useAuth } from '../../context/AuthContext';

export function FeedbackInbox({ canDelete }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await fetchFeedback()); setError(null); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try { await deleteFeedback(id); load(); } catch (err) { setError(err.message); }
  };

  return (
    <Panel icon={Inbox} title="User feedback" description="Sent from the Help page. No names or emails are collected."
      actions={(
        <button disabled={!rows.length} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}
          onClick={() => downloadCsv('seascan-feedback.csv', rows, [
            { label: 'category', value: (r) => r.category },
            { label: 'rating', value: (r) => r.rating },
            { label: 'message', value: (r) => r.message },
            { label: 'page', value: (r) => r.page },
            { label: 'sent_at', value: (r) => r.created_at },
          ])}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      )}>
      <Alert>{error}</Alert>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((f) => (
            <li key={f.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold capitalize">{f.category}</span>
                  {f.rating && <span className="text-amber-300">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>}
                  <span className="text-slate-500">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-line break-words">{f.message}</p>
              </div>
              {canDelete && (
                <button onClick={() => remove(f.id)} aria-label="Delete feedback" className="self-start p-2 rounded-lg text-rose-300 hover:bg-rose-950/40">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function QuestionsInbox() {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await fetchAllQuestions()); setError(null); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { can } = useAuth();
  const canDelete = can('questions.delete');

  const reply = async (id) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    try {
      await answerQuestion(id, text);
      setDrafts((d) => ({ ...d, [id]: '' }));
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (q) => {
    const what = q.answer ? 'this question and its answer' : 'this question';
    if (!window.confirm(`Delete ${what} permanently? The person who asked will no longer see it.`)) return;
    try {
      await deleteQuestion(q.id);
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <Panel icon={MessageSquare} title="Community questions" description='Questions sent from "Ask a Researcher". Your reply is shown to the person who asked.'>
      <Alert>{error}</Alert>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No questions yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((q) => (
            <li key={q.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{q.topic}</span>
                <span className={q.status === 'Answered' ? 'text-emerald-300' : 'text-amber-300'}>{q.status}</span>
                <span className="text-slate-500">{new Date(q.created_at).toLocaleString()}</span>
                {canDelete && (
                  <button type="button" onClick={() => remove(q)} aria-label="Delete question"
                    title={q.answer ? 'Delete question and answer' : 'Delete question'}
                    className="ml-auto p-1.5 rounded-lg text-rose-300 hover:bg-rose-950/40 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-line">{q.question}</p>
              {q.answer ? (
                <p className="text-sm text-emerald-200/90 border-l-2 border-emerald-500/40 pl-3 whitespace-pre-line">{q.answer}</p>
              ) : (
                <div className="flex gap-2">
                  <textarea rows={2} className={`${inputClass} resize-none`} placeholder="Write a reply..."
                    value={drafts[q.id] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))} />
                  <button onClick={() => reply(q.id)} className={`${buttonClass} self-end bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1`}>
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
