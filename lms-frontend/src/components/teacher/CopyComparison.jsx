import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
export default function CopyComparison({
  submissionId,
  onClose
}) {
  const {
    authFetch
  } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`/api/submissions/${submissionId}/comparison`);
        const json = await res.json();
        if (!res.ok) throw Error(json.message);
        setData(json);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [submissionId, authFetch]);
  const match = data?.matches[selected];
  function highlighted() {
    if (!data) return null;
    const nodes = [];
    let cursor = 0;
    for (const p of match?.passages || []) {
      nodes.push(data.text.slice(cursor, p.start));
      nodes.push(<mark key={p.start} className="bg-yellow-200">{data.text.slice(p.start, p.end)}</mark>);
      cursor = p.end;
    }
    nodes.push(data.text.slice(cursor));
    return nodes;
  }
  return <div className="fixed inset-0 z-[100] bg-black/50 p-4 md:p-10 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-label="Assignment comparison" className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto p-6"><div className="flex justify-between mb-4"><h2 className="font-serif text-2xl">Matching passages</h2><button onClick={onClose} className="border rounded px-3 py-1">Close</button></div><p className="text-sm text-gray-500 mb-4">Highlights show matching sequences of at least 8 words from other students in the same assignment. Shared instructions and citations may also match; review the evidence before deciding.</p>{error ? <p role="alert" className="text-red-700">{error}</p> : !data ? <p>Extracting and comparing documents…</p> : <>{data.matches.length ? <select className="border rounded p-2 mb-4" value={selected} onChange={e => setSelected(Number(e.target.value))}>{data.matches.map((m, i) => <option key={i} value={i}>{m.student} · {m.passages.length} matching passages</option>)}</select> : <p className="bg-green-50 p-3 mb-4">No matching sequences of eight or more words found.</p>}<div className="grid md:grid-cols-2 gap-6"><section><h3 className="font-bold mb-3">Submitted document</h3><div className="border rounded p-4 whitespace-pre-wrap text-sm leading-relaxed">{highlighted()}</div></section><section><h3 className="font-bold mb-3">Source: {match?.student || 'No matches'}</h3>{match?.passages.map((p, i) => <div key={i} className="border rounded p-4 mb-3"><p className="text-xs text-gray-500 mb-2">{p.wordCount} matching words</p><mark className="bg-yellow-200 whitespace-pre-wrap text-sm">{p.sourceText}</mark></div>)}</section></div></>}</div></div>;
}
