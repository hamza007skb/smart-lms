import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
export default function AcademicRecord() {
  const {
    authFetch
  } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/academic/my-record');
        const json = await res.json();
        if (!res.ok) throw Error(json.message);
        setData(json);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [authFetch]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading academic record…</p>;
  return <div className="max-w-5xl mx-auto"><h1 className="font-serif text-3xl mb-2">Semester results</h1><p className="text-gray-500 mb-6">Published results only. GPA and CGPA are weighted by course credit hours.</p><div className="grid md:grid-cols-3 gap-4 mb-8">{[['CGPA', data.cgpa.toFixed(2)], ['Graded credit hours', data.creditHours], ['Fee balance', data.fee ? data.fee.remainingBalance.toLocaleString() : 'No fee assigned']].map(([label, value]) => <div key={label} className="p-6 border bg-white rounded-xl"><p className="text-gray-500 text-sm">{label}</p><p className="font-serif text-3xl mt-2">{value}</p></div>)}</div>{data.fee && <p className="mb-6 text-sm">Total fee: {data.fee.totalFee.toLocaleString()} · Paid: {data.fee.paidAmount.toLocaleString()}</p>}{!data.semesters.length && <p className="p-8 bg-white border rounded-xl">No published results yet.</p>}{data.semesters.map(s => <section key={s.id} className="bg-white border rounded-xl mb-6 overflow-auto"><div className="p-5 flex justify-between"><h2 className="font-serif text-xl">{s.name} <small className="text-gray-500">({s.status})</small></h2><p>Semester GPA <strong>{s.gpa.toFixed(2)}</strong></p></div><table className="w-full text-left"><thead className="bg-purple-50"><tr>{['Course', 'Credit hours', 'Total', 'Letter', 'GPA'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{s.courses.map(c => <tr key={c.id} className="border-t"><td className="p-3">{c.code} · {c.name}</td><td>{c.creditHours}</td><td>{c.total}%</td><td>{c.letterGrade}</td><td>{c.gpa.toFixed(2)}</td></tr>)}</tbody></table></section>)}</div>;
}
