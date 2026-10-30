import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function ManageResults() {
  const {
    id
  } = useParams();
  const {
    authFetch
  } = useAuth();
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState([]);
  const [config, setConfig] = useState([]);
  const [active, setActive] = useState(null);
  const [marks, setMarks] = useState({});
  const [total, setTotal] = useState(10);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function request(url, options) {
    const res = await authFetch(url, options);
    const data = await res.json();
    if (!res.ok) throw Error(data.message);
    return data;
  }
  async function load() {
    try {
      const [c, g, a] = await Promise.all([request(`/api/courses/${id}`), request(`/api/grades/${id}`), request('/api/academic/assessment-config')]);
      setCourse(c);
      setGrades(g);
      setConfig(a);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id, authFetch]);
  const locked = grades.some(g => g.locked);
  const ended = course?.semester?.status === 'ended';
  function open(a) {
    setActive(a);
    const values = {};
    for (const student of course.students) {
      const g = grades.find(g => g.student === student._id);
      values[student._id] = a.index === null ? g?.[a.category] || 0 : g?.[a.category]?.[a.index] || 0;
    }
    setMarks(values);
    const g = grades[0];
    setTotal((a.index === null ? g?.[a.totalField] : g?.[a.totalField]?.[a.index]) || 10);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await request('/api/grades/save', {
        method: 'POST',
        body: JSON.stringify({
          courseId: id,
          ...active,
          totalMarks: Number(total),
          records: Object.entries(marks).map(([studentId, mark]) => ({
            studentId,
            mark: Number(mark)
          }))
        })
      });
      setActive(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!window.confirm('Publish and lock all final results? Teachers cannot edit published results.')) return;
    setBusy(true);
    setError('');
    try {
      await request(`/api/grades/${id}/publish`, {
        method: 'POST'
      });
      setActive(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>Loading gradebook…</p>;
  return <div className="max-w-6xl mx-auto"><Link className="text-purple-800" to={`/teacher/course/${id}`}>← Back to course</Link><div className="flex justify-between my-6"><div><h1 className="font-serif text-3xl">{course?.name} · Gradebook</h1><p className="text-gray-500 text-sm mt-2">Quizzes 15% · Assignments 10% · Midterm 25% · Final 40% · Presentation 5% · Attendance 5%</p></div><button disabled={busy || locked || ended || !course?.students.length} onClick={publish} className="bg-purple-900 text-white rounded-lg px-4 py-2 disabled:opacity-50">{locked ? 'Results published & locked' : 'Publish final results'}</button></div>{error && <p role="alert" className="bg-red-50 text-red-800 p-4 mb-4">{error}</p>}
 <div className="grid md:grid-cols-4 gap-3 mb-6">{config.map(a => <button key={a.title} disabled={locked || ended || busy} onClick={() => open(a)} className="text-left border rounded-xl bg-white p-4 disabled:opacity-60"><strong>{a.title}</strong><p className="text-gray-500 text-sm">{a.weight}% weight</p></button>)}</div>
 {active && !locked && <form className="bg-white border rounded-xl p-6 mb-6" onSubmit={save}><h2 className="font-serif text-xl mb-4">{active.title}</h2><label>Total marks <input className="border p-2 rounded ml-2" required type="number" min="0.01" step="any" value={total} onChange={e => setTotal(e.target.value)} /></label><div className="space-y-3 my-4">{course.students.map(s => <label className="flex justify-between border-b py-2" key={s._id}>{s.name} · {s.rollNumber || 'No roll number'}<input className="border p-2 rounded" required type="number" min="0" max={total} step="any" value={marks[s._id]} onChange={e => setMarks({
            ...marks,
            [s._id]: e.target.value
          })} /></label>)}</div><button disabled={busy} className="bg-purple-900 text-white px-4 py-2 rounded mr-3">Save marks</button><button type="button" onClick={() => setActive(null)}>Cancel</button></form>}
 <div className="bg-white border rounded-xl overflow-auto"><table className="w-full text-left"><thead className="bg-purple-50"><tr>{['Student', 'Roll number', 'Weighted total', 'Letter', 'GPA', 'Status'].map(t => <th className="p-4" key={t}>{t}</th>)}</tr></thead><tbody>{course?.students.map(s => {
            const g = grades.find(g => g.student === s._id);
            return <tr key={s._id} className="border-t"><td className="p-4">{s.name}</td><td>{s.rollNumber || '—'}</td><td>{g?.total ?? 0}%</td><td>{g?.letterGrade || '—'}</td><td>{g?.gpa?.toFixed(2) || '—'}</td><td>{g?.published ? 'Published' : 'Draft'}</td></tr>;
          })}</tbody></table></div><p className="text-sm text-gray-500 mt-4">Final publication locks this course’s gradebook. Unentered marks count as zero. Check every assessment before publishing.</p></div>;
}
