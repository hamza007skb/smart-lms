import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
const initial = {
  users: [],
  courses: [],
  departments: [],
  semesters: [],
  fees: [],
  timetable: []
};
const tabs = ['Overview', 'Users', 'Courses', 'Departments', 'Semesters', 'Timetable', 'Fees'];
const defaults = {
  Users: {
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    department: '',
    rollNumber: '',
    active: true
  },
  Courses: {
    name: '',
    code: '',
    description: '',
    teacher: '',
    department: '',
    semester: '',
    creditHours: 3,
    capacity: 50,
    enrollmentDeadline: '',
    status: 'active'
  },
  Departments: {
    name: '',
    code: ''
  },
  Semesters: {
    name: '',
    startDate: '',
    endDate: ''
  },
  Timetable: {
    course: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00'
  },
  Fees: {
    student: '',
    totalFee: 0,
    paidAmount: 0
  }
};
export default function AdminPortal() {
  const {
    user,
    authFetch,
    logout
  } = useAuth();
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState('Overview');
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function request(url, method = 'GET', body) {
    const res = await authFetch(url, {
      method,
      ...(body ? {
        body: JSON.stringify(body)
      } : {})
    });
    const json = await res.json();
    if (!res.ok) throw Error(json.message || 'Request failed');
    return json;
  }
  async function load() {
    try {
      setData(await request('/api/admin/overview'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [authFetch]);
  function open(item) {
    setError('');
    setNotice('');
    setEditing(item?._id || null);
    const values = {
      ...defaults[tab]
    };
    if (item) for (const key of Object.keys(values)) {
      values[key] = item[key]?._id ?? item[key] ?? values[key];
      if (['startDate', 'endDate'].includes(key) && item[key]) values[key] = item[key].slice(0, 10);
      if (key === 'enrollmentDeadline' && item[key]) {
        const date = new Date(item[key]);
        values[key] = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      if (key === 'active') values[key] = item.active !== false;
    }
    setForm(values);
  }
  async function mutate(url, method, body, message = 'Saved successfully') {
    setBusy(true);
    setError('');
    try {
      await request(url, method, body);
      setNotice(message);
      setForm(null);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    const resource = tab.toLowerCase();
    const url = tab === 'Fees' ? `/api/admin/fees/${form.student}` : `/api/admin/${resource}${editing ? `/${editing}` : ''}`;
    const payload = {
      ...form
    };
    if (payload.enrollmentDeadline) payload.enrollmentDeadline = new Date(payload.enrollmentDeadline).toISOString();
    mutate(url, editing || tab === 'Fees' ? 'PUT' : 'POST', payload);
  }
  function remove(resource, id) {
    if (window.confirm('Delete this record? Linked academic records are protected.')) mutate(`/api/admin/${resource}/${id}`, 'DELETE');
  }
  function field(key) {
    const value = form[key];
    let options;
    if (key === 'role') options = ['teacher', 'student', 'admin'].map(v => ({
      value: v,
      label: v
    }));
    if (key === 'status') options = ['active', 'draft', 'closed'].map(v => ({
      value: v,
      label: v
    }));
    if (key === 'day') options = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(v => ({
      value: v,
      label: v
    }));
    if (['department', 'semester', 'teacher', 'student', 'course'].includes(key)) {
      const list = key === 'department' ? data.departments : key === 'semester' ? data.semesters.filter(s => s.status !== 'ended') : key === 'course' ? data.courses : data.users.filter(u => u.role === (key === 'teacher' ? 'teacher' : 'student') && u.active !== false);
      options = list.map(v => ({
        value: v._id,
        label: v.name + (v.code ? ` (${v.code})` : '')
      }));
    }
    const label = key.replace(/([A-Z])/g, ' $1');
    const numeric = ['creditHours', 'capacity', 'totalFee', 'paidAmount'].includes(key);
    return <label key={key} className="block text-sm capitalize">{label}{key === 'password' && editing ? ' (leave blank to keep)' : ''}
   {key === 'active' ? <input className="ml-3" type="checkbox" checked={value} onChange={e => setForm({
        ...form,
        [key]: e.target.checked
      })} /> : options ? <select className="border rounded-lg p-2 mt-1 w-full bg-white" value={value} required={['teacher', 'student', 'course', 'semester'].includes(key)} onChange={e => setForm({
        ...form,
        [key]: e.target.value
      })}><option value="">Select {label}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input className="border rounded-lg p-2 mt-1 w-full" type={key === 'password' ? 'password' : key === 'email' ? 'email' : ['startDate', 'endDate'].includes(key) ? 'date' : key === 'enrollmentDeadline' ? 'datetime-local' : ['startTime', 'endTime'].includes(key) ? 'time' : numeric ? 'number' : 'text'} value={value} min={numeric ? 0 : undefined} step={key === 'creditHours' ? 0.5 : 1} minLength={key === 'password' ? 8 : undefined} required={!['description', 'department', 'rollNumber', 'enrollmentDeadline'].includes(key) && !(key === 'password' && editing)} onChange={e => setForm({
        ...form,
        [key]: numeric ? Number(e.target.value) : e.target.value
      })} />}
  </label>;
  }
  const cell = children => <td className="p-3 border-b text-sm">{children}</td>;
  const button = (text, onClick, danger = false) => <button type="button" disabled={busy} onClick={onClick} className={`px-3 py-1.5 text-sm rounded-lg border mr-2 disabled:opacity-50 ${danger ? 'text-red-700' : 'text-purple-900'}`}>{text}</button>;
  const table = (headers, rows) => <div className="overflow-auto bg-white rounded-xl border"><table className="w-full text-left whitespace-nowrap"><thead className="bg-purple-50"><tr>{headers.map(h => <th key={h} className="p-3 text-xs uppercase text-purple-900">{h}</th>)}</tr></thead><tbody>{rows.length ? rows : <tr><td colSpan={headers.length} className="p-8 text-center text-gray-500">No records yet.</td></tr>}</tbody></table></div>;
  return <div className="min-h-screen bg-[var(--off-white)]"><header className="bg-[var(--plum-950)] text-white px-8 py-5 flex justify-between items-center"><div><span className="font-serif text-2xl">Academica</span><span className="ml-4 text-xs uppercase tracking-widest">Administration</span></div><div>{user?.name} <button className="ml-6 border rounded-lg px-3 py-1" onClick={logout}>Sign out</button></div></header><main className="max-w-7xl mx-auto p-6 md:p-10"><nav className="flex gap-2 flex-wrap mb-8">{tabs.map(t => <button key={t} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-[var(--plum-800)] text-white' : 'bg-white border'}`} onClick={() => {
          setTab(t);
          setForm(null);
          setEditing(null);
          setError('');
          setNotice('');
        }}>{t}</button>)}</nav>
 <div className="flex justify-between mb-6"><div><h1 className="font-serif text-3xl">{tab}</h1><p className="text-gray-500 text-sm mt-1">Manage your academic workspace.</p></div>{tab !== 'Overview' && button(tab === 'Fees' ? 'Set student fee' : `Add ${tab === 'Users' ? 'user' : tab === 'Courses' ? 'course' : tab === 'Departments' ? 'department' : tab === 'Semesters' ? 'semester' : 'time slot'}`, () => open())}</div>
 {error && <p role="alert" className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg mb-4">{error}</p>}{notice && <p role="status" className="bg-green-50 text-green-800 p-4 rounded-lg mb-4">{notice}</p>}
 {form && <form onSubmit={save} className="bg-white border rounded-xl p-6 mb-6"><h2 className="font-serif text-xl mb-4">{editing ? 'Edit' : 'New'} record</h2><div className="grid md:grid-cols-3 gap-4">{Object.keys(form).map(field)}</div><div className="mt-6"><button disabled={busy} className="bg-[var(--plum-800)] text-white px-5 py-2 rounded-lg mr-3">{busy ? 'Saving…' : 'Save'}</button>{button('Cancel', () => setForm(null))}</div></form>}
 {loading ? <p>Loading administration…</p> : <>
 {tab === 'Overview' && <><div className="grid md:grid-cols-4 gap-4">{[['Students', data.users.filter(u => u.role === 'student').length], ['Teachers', data.users.filter(u => u.role === 'teacher').length], ['Courses', data.courses.length], ['Active semesters', data.semesters.filter(s => s.status === 'active').length]].map(([label, value]) => <div className="bg-white border rounded-xl p-6" key={label}><p className="text-gray-500 text-sm">{label}</p><p className="font-serif text-4xl mt-2">{value}</p></div>)}</div><div className="bg-white border rounded-xl p-6 mt-6"><h2 className="font-serif text-xl mb-3">Semester setup</h2><p className="text-gray-600">Create departments, onboard teachers and students, plan a semester, then assign courses, credit hours and timetable slots. Start the semester to open enrollment. Teachers publish final results before you end it.</p></div></>}
 {tab === 'Users' && table(['Name', 'Email', 'Role', 'Department', 'Roll number', 'Status', 'Actions'], data.users.map(u => <tr key={u._id}>{cell(u.name)}{cell(u.email)}{cell(u.role)}{cell(u.department?.code || '—')}{cell(u.rollNumber || '—')}{cell(u.active === false ? 'Inactive' : 'Active')}{cell(<>{button('Edit', () => open(u))}{button('Delete', () => remove('users', u._id), true)}</>)}</tr>))}
 {tab === 'Courses' && table(['Course', 'Teacher', 'Semester', 'Credits', 'Enrollment', 'Join code', 'Actions'], data.courses.map(c => <tr key={c._id}>{cell(<>{c.code} · {c.name}<p className="text-xs text-gray-500">{c.status} · {c.department?.code || 'No department'}</p></>)}{cell(c.teacher?.name)}{cell(c.semester?.name || 'Unassigned')}{cell(c.creditHours)}{cell(<>{c.students.length}/{c.capacity}<p className="text-xs">{c.enrollmentDeadline ? new Date(c.enrollmentDeadline).toLocaleString() : 'No cutoff'}</p></>)}{cell(c.joinCode)}{cell(<>{button('Edit', () => open(c))}{button('Delete', () => remove('courses', c._id), true)}</>)}</tr>))}
 {tab === 'Departments' && table(['Name', 'Code', 'Actions'], data.departments.map(d => <tr key={d._id}>{cell(d.name)}{cell(d.code)}{cell(<>{button('Edit', () => open(d))}{button('Delete', () => remove('departments', d._id), true)}</>)}</tr>))}
 {tab === 'Semesters' && table(['Semester', 'Dates', 'Status', 'Actions'], data.semesters.map(s => <tr key={s._id}>{cell(s.name)}{cell(`${s.startDate.slice(0, 10)} → ${s.endDate.slice(0, 10)}`)}{cell(s.status)}{cell(s.status === 'planned' ? button('Start semester', () => mutate(`/api/admin/semesters/${s._id}/start`, 'POST', {})) : s.status === 'active' ? button('End semester', () => {
            if (window.confirm('End this semester? All enrolled students must have published final results. Course records will become read-only.')) mutate(`/api/admin/semesters/${s._id}/end`, 'POST', {});
          }) : 'Completed')}</tr>))}
 {tab === 'Timetable' && table(['Course', 'Day', 'Start', 'End', 'Actions'], data.timetable.map(t => <tr key={t._id}>{cell(t.course?.name)}{cell(t.day)}{cell(t.startTime)}{cell(t.endTime)}{cell(button('Delete', () => remove('timetable', t._id), true))}</tr>))}
 {tab === 'Fees' && table(['Student', 'Roll number', 'Total fee', 'Paid', 'Balance', 'Actions'], data.fees.map(f => <tr key={f._id}>{cell(f.student?.name)}{cell(f.student?.rollNumber || '—')}{cell(f.totalFee)}{cell(f.paidAmount)}{cell(f.remainingBalance)}{cell(<>{button('Edit', () => open(f))}{button('Delete', () => remove('fees', f._id), true)}</>)}</tr>))}
 </>}
 </main></div>;
}
