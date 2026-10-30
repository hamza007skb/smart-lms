import CopyComparison from '../../components/teacher/CopyComparison';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimilarityBadge from '../../components/teacher/SimilarityBadge';
import { useAuth } from '../../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function extractFilename(path) {
  if (!path) return 'No File';
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

export default function ViewSubmissions() {
  const { assignmentId } = useParams(); 
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  
  // Selection States
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(assignmentId || '');
  
  // Data States
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Filter & Sort States
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [comparisonId, setComparisonId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null); // Tracks which button is currently loading

  // 1. Initial Load
  useEffect(() => {
    const fetchInitialData = async () => {
      let loadedCourses = [];
      try {
        const courseRes = await authFetch('/api/courses/teacher');
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          loadedCourses = Array.isArray(courseData) ? courseData : (courseData.courses || []);
          setCourses(loadedCourses);
        }
      } catch (error) {
        console.error("Failed to load courses", error);
      }

      if (assignmentId) {
        try {
          const assignRes = await authFetch(`/api/assignments/single/${assignmentId}`);
          if (assignRes.ok) {
            const assignData = await assignRes.json();
            const cId = assignData.course?._id || assignData.course;
            
            if (loadedCourses.length === 0 || !loadedCourses.find(c => c._id === cId)) {
              setCourses(prev => [...prev, { _id: cId, name: assignData.course?.name || 'Selected Course' }]);
            }
            setSelectedCourse(cId);
          }
        } catch (error) {
          console.error("Failed to fetch assignment details", error);
        }
      } else if (loadedCourses.length > 0) {
        setSelectedCourse(loadedCourses[0]._id);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [assignmentId, authFetch]);

  // 2. Cascade Course -> Assignments
  useEffect(() => {
    if (!selectedCourse) return;
    const fetchAssignments = async () => {
      try {
        const assignRes = await authFetch(`/api/assignments/${selectedCourse}`);
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          setAssignments(assignData);
          setSelectedAssignment(currentId => {
            if (assignData.find(a => a._id === currentId)) return currentId;
            return assignData.length > 0 ? assignData[0]._id : '';
          });
        }
      } catch (error) {
        console.error("Failed to load assignments", error);
      }
    };
    fetchAssignments();
  }, [selectedCourse, authFetch]);

  // 3. Fetch Submissions
  useEffect(() => {
    if (!selectedAssignment) {
      setSubmissions([]);
      return;
    }
    const fetchSubmissions = async () => {
      setLoadingSubmissions(true);
      try {
        const subRes = await authFetch(`/api/submissions/assignment/${selectedAssignment}`);
        if (subRes.ok) {
          setSubmissions(await subRes.json());
        }
        navigate(`/teacher/assignment/${selectedAssignment}/submissions`, { replace: true });
      } catch (error) {
        console.error("Failed to load submissions", error);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    fetchSubmissions();
  }, [selectedAssignment, authFetch, navigate]);

  // =================================================================
  // 4. NEW: 1-Click "Mark as Reviewed" Handler
  // =================================================================
  const handleMarkAsReviewed = async (subId) => {
    setReviewingId(subId); // Start loading state for this specific button
    try {
      const res = await authFetch(`/api/submissions/${subId}/review`, {
        method: 'PUT'
      });

      if (res.ok) {
        // Instantly update the UI to show it as reviewed
        setSubmissions(prev => prev.map(sub => 
          sub._id === subId ? { ...sub, status: 'reviewed' } : sub
        ));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Error marking as reviewed", error);
    } finally {
      setReviewingId(null); // Stop loading state
    }
  };

  // Sorting and Filtering logic
  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const displayed = submissions
    .filter(s => filter === 'flagged' ? (s.similarityScore || 0) >= 75 : filter === 'pending' ? s.status === 'pending' : true)
    .sort((a, b) => {
      let av, bv;
      if (sortKey === 'student') {
        av = a.student?.name?.toLowerCase() || '';
        bv = b.student?.name?.toLowerCase() || '';
      } else if (sortKey === 'submittedAt') {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else if (sortKey === 'similarity') {
        av = a.similarityScore || 0;
        bv = b.similarityScore || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

  const flaggedCount = submissions.filter(s => (s.similarityScore || 0) >= 75).length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const currentAssignmentData = assignments.find(a => a._id === selectedAssignment);

  const ThBtn = ({ col, label }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors outline-none"
      style={{ color: sortKey === col ? 'var(--plum-700)' : 'var(--plum-400)' }}
    >
      {label}
      {sortKey === col && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </button>
  );

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: 'var(--plum-400)' }}>Loading Dashboard…</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-3xl mb-1" style={{ color: 'var(--plum-950)' }}>Review Submissions</h1>
          <p className="text-sm font-medium" style={{ color: 'var(--plum-500)' }}>Select a course and assignment to view student work.</p>
        </div>
        
        {flaggedCount > 0 && (
          <div className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            ⚠ {flaggedCount} High-Similarity Match{flaggedCount !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* DROPDOWN COMMAND CENTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-5 bg-[var(--cream)] rounded-xl shadow-sm border" style={{ borderColor: 'var(--plum-200)' }}>
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--plum-800)' }}>1. Select Course</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full p-3 rounded-lg border outline-none font-bold shadow-sm focus:border-[var(--plum-500)]" style={{ color: 'var(--plum-950)' }}>
            {courses.length === 0 && <option value="">No courses available</option>}
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--plum-800)' }}>2. Select Assignment</label>
          <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} className="w-full p-3 rounded-lg border outline-none font-bold shadow-sm focus:border-[var(--plum-500)]" style={{ color: 'var(--plum-950)' }} disabled={assignments.length === 0 || !selectedCourse}>
            {assignments.length === 0 && <option value="">No assignments found</option>}
            {assignments.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
          </select>
        </div>
      </div>

      {/* Filter tabs updated with Pending Count */}
      {selectedAssignment && (
        <div className="flex gap-2 mb-4">
          {[['all', 'All Submissions'], ['pending', `Needs Review (${pendingCount})`], ['flagged', `Flagged (${flaggedCount})`]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all outline-none"
              style={{
                background: filter === val ? 'var(--plum-800)' : 'white',
                color:      filter === val ? 'white'             : 'var(--plum-600)',
                border:     '1px solid ' + (filter === val ? 'var(--plum-800)' : 'var(--warm-gray)'),
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
        {loadingSubmissions ? (
          <div className="p-12 text-center text-sm font-bold" style={{ color: 'var(--plum-600)' }}>Fetching student files...</div>
        ) : !selectedAssignment ? (
          <div className="p-12 text-center text-sm font-bold" style={{ color: 'var(--plum-500)' }}>Please select an assignment above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--warm-gray)', background: 'var(--plum-900)' }}>
                  <th className="px-6 py-4"><ThBtn col="student" label="Student Name" /></th>
                  <th className="px-6 py-4"><span className="text-xs font-medium uppercase tracking-wider text-[var(--plum-200)]">Roll Number</span></th>
                  <th className="px-6 py-4"><span className="text-xs font-medium uppercase tracking-wider text-[var(--plum-200)]">File Download</span></th>
                  <th className="px-6 py-4"><ThBtn col="submittedAt" label="Submitted Time" /></th>
                  <th className="px-6 py-4"><ThBtn col="similarity" label="AI Similarity" /></th>
                  {/* THE NEW COLUMN HEADER */}
                  <th className="px-6 py-4"><span className="text-xs font-medium uppercase tracking-wider text-[var(--plum-200)]">Review Status</span></th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm font-bold" style={{ color: 'var(--plum-400)' }}>
                      No submissions match this filter.
                    </td>
                  </tr>
                ) : displayed.map((s, i) => {
                  const deadline = currentAssignmentData?.deadline;
                  const isLate = deadline && new Date(s.createdAt) > new Date(deadline);
                  
                  return (
                  <tr
                    key={s._id}
                    style={{
                      borderBottom: i < displayed.length - 1 ? '1px solid var(--warm-gray)' : 'none',
                      background:   (s.similarityScore || 0) >= 75 ? '#fff8f8' : 'transparent',
                    }}
                    className="hover:bg-[var(--cream)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--plum-100)', color: 'var(--plum-800)' }}>
                          {s.student?.name ? s.student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--plum-950)' }}>
                          {s.student?.name || 'Unknown Student'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--plum-600)' }}>
                      {s.student?.rollNumber || 'N/A'}
                      <span className={s.timing === 'late' ? 'text-red-700 ml-2' : 'text-green-700 ml-2'}>{s.timing === 'late' ? 'Late' : 'On time'}</span>
                      <button className="block text-xs underline text-purple-800 mt-2" onClick={() => setComparisonId(s._id)}>Compare matching passages</button>
                    </td>

                    <td className="px-6 py-4">
                      {s.fileUrl ? (
                        <a
                          href={`/${s.fileUrl.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors hover:underline"
                          style={{ color: 'var(--plum-800)' }}
                        >
                          <span>📎</span>
                          <span className="truncate max-w-[160px]">{extractFilename(s.fileUrl)}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium">No File</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium" style={{ color: 'var(--plum-900)' }}>
                        {formatDate(s.createdAt)}
                      </div>
                      {isLate && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1 inline-block">
                          Late
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {s.similarityScore !== undefined ? (
                        <div className="flex flex-col gap-1 items-start">
                          <SimilarityBadge score={s.similarityScore} />
                          {s.similarityScore >= 75 && s.matchedWith && (
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Similar to: {s.matchedWith.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded">Pending</span>
                      )}
                    </td>

                    {/* THE NEW REVIEW STATUS CELL */}
                    <td className="px-6 py-4">
                      {s.status === 'reviewed' || s.status === 'graded' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                          ✓ Reviewed
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleMarkAsReviewed(s._id)}
                          disabled={reviewingId === s._id}
                          className="text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors text-white hover:bg-[var(--plum-800)] disabled:opacity-50" 
                          style={{ background: 'var(--plum-600)' }}
                        >
                          {reviewingId === s._id ? 'Saving...' : 'Mark as Reviewed'}
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--plum-500)' }}>
        Showing {displayed.length} of {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
      </p>
      {comparisonId && <CopyComparison submissionId={comparisonId} onClose={() => setComparisonId(null)} />}
    </div>
  );
}