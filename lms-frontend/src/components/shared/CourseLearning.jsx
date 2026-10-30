import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
export default function CourseLearning({
  courseId
}) {
  const {
    authFetch,
    token,
    user
  } = useAuth();
  const [data, setData] = useState({
    discussions: [],
    lectures: [],
    timetable: []
  });
  const [content, setContent] = useState('');
  const [parent, setParent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [type, setType] = useState('video');
  async function load() {
    try {
      const res = await authFetch(`/api/learning/${courseId}`);
      const json = await res.json();
      if (!res.ok) throw Error(json.message);
      setData(json);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [courseId, authFetch]);
  async function post(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await authFetch(`/api/learning/${courseId}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          parent: parent || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw Error(json.message);
      setContent('');
      setParent('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    e.preventDefault();
    const element = e.currentTarget;
    setBusy(true);
    setError('');
    const body = new FormData();
    body.append('title', title);
    body.append('type', type);
    if (file) body.append('file', file);else body.append('fileUrl', url);
    try {
      const res = await fetch(`/api/learning/${courseId}/lectures`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body
      });
      const json = await res.json();
      if (!res.ok) throw Error(json.message);
      setTitle('');
      setFile(null);
      setUrl('');
      element.reset();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind, id) {
    setError('');
    try {
      const res = await authFetch(`/api/learning/${courseId}/${kind}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw Error((await res.json()).message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  const canManage = user?.role === 'teacher' || user?.role === 'admin';
  function thread(parentId = null, depth = 0) {
    return data.discussions.filter(d => (d.parent || null) === parentId).map(d => <div key={d._id} className={`border-l-2 pl-4 py-2 ${depth ? 'ml-4' : ''}`}><p className="text-xs text-gray-500">{d.author?.name} · {d.author?.role} · {new Date(d.createdAt).toLocaleString()}</p><p className="whitespace-pre-wrap my-2">{d.content}</p><button className="text-xs text-purple-800 mr-3" onClick={() => setParent(d._id)}>Reply</button>{(canManage || d.author?._id === user?._id) && <button className="text-xs text-red-700" onClick={() => remove('discussions', d._id)}>Remove</button>}{depth < 20 && thread(d._id, depth + 1)}</div>);
  }
  return <section className="mt-8 space-y-6">{error && <p role="alert" className="bg-red-50 text-red-800 p-3 rounded">{error}</p>}<div className="bg-white border rounded-xl p-6"><h2 className="font-serif text-2xl mb-4">Class timetable</h2>{data.timetable.length ? data.timetable.map(t => <p className="py-2 border-b" key={t._id}>{t.day} · {t.startTime} – {t.endTime}</p>) : <p className="text-gray-500 text-sm">No time slots assigned.</p>}</div>
 <div className="bg-white border rounded-xl p-6"><h2 className="font-serif text-2xl mb-4">Lecture materials</h2>{data.lectures.map(l => <div key={l._id} className="flex justify-between border-b py-3"><a className="text-purple-800 underline" href={l.fileUrl.startsWith('uploads/') ? `/${l.fileUrl}` : l.fileUrl} target="_blank" rel="noreferrer">{l.type === 'pdf' ? 'PDF' : 'Video'} · {l.title}</a>{canManage && <button className="text-red-700 text-xs" onClick={() => remove('lectures', l._id)}>Remove</button>}</div>)}{!data.lectures.length && <p className="text-gray-500 text-sm">No lecture materials yet.</p>}{canManage && <form onSubmit={upload} className="mt-4 border-t pt-4 space-y-3"><input className="border p-2 rounded w-full" placeholder="Lecture title" required value={title} onChange={e => setTitle(e.target.value)} /><input type="file" accept=".pdf,.mp4,.webm" onChange={e => setFile(e.target.files[0])} /><p className="text-xs text-gray-500">Upload PDF/MP4/WebM (up to 100 MB), or add an HTTPS link.</p>{!file && <div className="flex gap-2"><select className="border p-2 rounded" value={type} onChange={e => setType(e.target.value)}><option value="video">Video</option><option value="pdf">PDF</option></select><input required type="url" placeholder="https://…" className="border p-2 rounded flex-1" value={url} onChange={e => setUrl(e.target.value)} /></div>}<button disabled={busy} className="bg-purple-900 text-white px-4 py-2 rounded disabled:opacity-50">Add lecture</button></form>}</div>
 <div className="bg-white border rounded-xl p-6"><h2 className="font-serif text-2xl mb-4">Course discussions</h2>{thread()}{!data.discussions.length && <p className="text-gray-500 text-sm">Start the discussion.</p>}<form onSubmit={post} className="mt-4">{parent && <p className="text-sm mb-2">Replying to {data.discussions.find(d => d._id === parent)?.author?.name} <button type="button" className="underline ml-2" onClick={() => setParent('')}>Cancel reply</button></p>}<textarea className="w-full border rounded p-3" required maxLength={10000} placeholder="Share a question or comment…" value={content} onChange={e => setContent(e.target.value)} /><button disabled={busy} className="bg-purple-900 text-white px-4 py-2 rounded mt-2 disabled:opacity-50">Post {parent ? 'reply' : 'discussion'}</button></form></div></section>;
}
