import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function StudentMarks() {
  const {
    id
  } = useParams();
  const {
    authFetch
  } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const responses = await Promise.all([authFetch(`/api/courses/${id}`), authFetch(`/api/grades/student/${id}`), authFetch('/api/academic/assessment-config')]);
        const json = await Promise.all(responses.map(r => r.json()));
        if (responses.some(r => !r.ok)) throw Error('Unable to load marks');
        setData({
          course: json[0],
          grade: json[1],
          config: json[2]
        });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, authFetch]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading marks…</p>;
  const {
    course,
    grade,
    config
  } = data;
  return <div className="max-w-5xl mx-auto"><Link to={`/student/course/${id}`}>← Back to course</Link><div className="bg-white border rounded-xl p-6 my-6"><h1 className="font-serif text-3xl">{course.name} · Academic record</h1><p className="mt-3">{grade.published ? 'Published final result' : 'Provisional marks — final result has not been published'}</p><p className="text-2xl mt-4">{grade.total}% · {grade.letterGrade} · GPA {grade.gpa.toFixed(2)}</p></div><div className="bg-white border rounded-xl overflow-auto"><table className="w-full text-left"><thead className="bg-purple-50"><tr>{['Assessment', 'Obtained', 'Total', 'Weight'].map(t => <th key={t} className="p-4">{t}</th>)}</tr></thead><tbody>{config.map(a => <tr className="border-t" key={a.title}><td className="p-4">{a.title}</td><td>{(a.index === null ? grade[a.category] : grade[a.category]?.[a.index]) || 0}</td><td>{(a.index === null ? grade[a.totalField] : grade[a.totalField]?.[a.index]) || 10}</td><td>{a.weight}%</td></tr>)}</tbody></table></div></div>;
}
