import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TakeAttendance({ course, onCancel }) {
  const { authFetch } = useAuth();
  
  const [currentView, setCurrentView] = useState('list');
  const [availableDates, setAvailableDates] = useState([]); 
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [fetchingDate, setFetchingDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. FETCH HISTORY WITH STATS
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const courseId = course._id || course.id;
        const res = await authFetch(`/api/attendance/course/${courseId}/dates`);
        if (res.ok) {
          setAvailableDates(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch attendance history");
      } finally {
        setLoadingHistory(false);
      }
    };
    if ((course._id || course.id) && currentView === 'list') {
      fetchHistory();
    }
  }, [course, currentView, refreshTrigger, authFetch]);

  // 2. FETCH SPECIFIC DATE - UNBREAKABLE VERSION
  useEffect(() => {
    const fetchDateAttendance = async () => {
      setFetchingDate(true);
      try {
        const courseId = course._id || course.id;
        console.log("--- BROWSER X-RAY ---");
        console.log("1. Fetching data for Course ID:", courseId);

        // A. Fetch fresh course data
        const courseRes = await authFetch(`/api/courses/${courseId}`);
        let safeStudents = [];

        if (courseRes.ok) {
          const fullCourse = await courseRes.json();
          console.log("2. Backend sent these students:", fullCourse.students);
          safeStudents = fullCourse.students || [];
        }

        // B. AGGRESSIVE FALLBACK
        if (safeStudents.length === 0) {
          console.log("3. Backend failed or empty, using Dashboard Backup:", course.students);
          safeStudents = course.students || [];
        }

        // C. Fetch the attendance records for this date
        const attendanceRes = await authFetch(`/api/attendance/${courseId}/${selectedDate}`);
        const attendanceData = await attendanceRes.json();
        const existingRecords = attendanceData.records || [];

        console.log("4. Past Attendance Records found:", existingRecords);

        // D. Force strings and merge
        const mergedList = safeStudents.map(student => {
          // Force the ID to be a string so React doesn't crash
          const studentId = student._id ? String(student._id) : String(student); 
          const existing = existingRecords.find(r => String(r.student) === studentId);
          
          return {
            student: studentId,
            name: student.name || 'Unknown Student',
            rollNumber: student.rollNumber || 'N/A',
            status: existing ? existing.status : 'Present' 
          };
        });

        console.log("5. Final Data given to React Table:", mergedList);
        console.log("-----------------------");

        setAttendanceList(mergedList);
      } catch (error) {
        console.error("React crash in fetchDateAttendance:", error);
      } finally {
        setFetchingDate(false);
      }
    };

    if (currentView === 'form' && selectedDate) {
      fetchDateAttendance();
    }
  }, [currentView, selectedDate, course, authFetch]);

  // ACTIONS
  const handleMarkNew = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setCurrentView('form');
  };

  const handleEdit = (dateString) => {
    setSelectedDate(dateString);
    setCurrentView('form');
  };

  const toggleStatus = (studentId) => {
    setAttendanceList(prev => prev.map(record => {
      if (record.student === studentId) {
        return { ...record, status: record.status === 'Present' ? 'Absent' : record.status === 'Absent' ? 'Leave' : 'Present' };
      }
      return record;
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const courseId = course._id || course.id;
      const res = await authFetch('/api/attendance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: courseId,
          date: selectedDate,
          records: attendanceList.map(r => ({ student: r.student, status: r.status })) 
        })
      });

      if (res.ok) {
        setRefreshTrigger(prev => prev + 1); 
        setCurrentView('list'); 
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      alert("Network error saving attendance.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // VIEW 1: THE HISTORY DASHBOARD
  // =========================================================
  if (currentView === 'list') {
    return (
      <div className="p-6 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--plum-200)' }}>
        <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--warm-gray)' }}>
          <div>
            <h3 className="font-serif text-2xl" style={{ color: 'var(--plum-950)' }}>Attendance Records</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--plum-600)' }}>{course.name}</p>
          </div>
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md border text-[var(--plum-700)] hover:bg-[var(--cream)] transition-colors">
            Close
          </button>
        </div>

        <div className="mb-6">
          <button 
            onClick={handleMarkNew}
            className="w-full md:w-auto px-6 py-3 rounded-lg text-white text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg"
            style={{ background: 'var(--plum-800)' }}
          >
            + Mark New Attendance
          </button>
        </div>

        <h4 className="font-serif text-lg mb-3" style={{ color: 'var(--plum-900)' }}>Past Registers</h4>
        
        {loadingHistory ? (
          <p className="text-sm p-4 text-center text-[var(--plum-500)]">Loading history...</p>
        ) : availableDates.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--plum-200)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--plum-700)' }}>No attendance records found.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--plum-500)' }}>Click the button above to start your first register.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {availableDates.map(record => {
              const dateObj = new Date(record.date);
              return (
                <div key={record.date} className="flex justify-between items-center p-4 rounded-lg border bg-[var(--cream)] hover:shadow-sm transition-all" style={{ borderColor: 'var(--plum-100)' }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--plum-950)' }}>
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs" style={{ color: 'var(--plum-500)' }}>{dateObj.getFullYear()}</p>
                      <div className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border" style={{ background: 'white', borderColor: 'var(--plum-200)', color: 'var(--plum-800)' }}>
                        <span className={record.presentCount < record.totalStudents ? 'text-orange-600' : 'text-green-600'}>
                          {record.presentCount}
                        </span>
                        <span style={{ color: 'var(--plum-400)' }}> / {record.totalStudents} Present</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEdit(record.date)}
                    className="px-4 py-2 rounded-md text-xs font-bold border bg-white transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--plum-300)', color: 'var(--plum-800)' }}
                  >
                    Edit
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 2: THE FORM PAGE
  // =========================================================
  return (
    <div className="p-6 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--plum-200)' }}>
      <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--warm-gray)' }}>
        <div>
          <button 
            type="button"
            onClick={() => setCurrentView('list')}
            className="text-xs font-bold uppercase tracking-wider mb-2 hover:underline flex items-center gap-1" 
            style={{ color: 'var(--plum-600)' }}
          >
            ← Back to History
          </button>
          <h3 className="font-serif text-2xl" style={{ color: 'var(--plum-950)' }}>
            Register for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border rounded-md text-sm outline-none bg-white focus:border-[var(--plum-500)]"
        />
      </div>

      <form onSubmit={handleSave}>
        {fetchingDate ? (
          <div className="p-12 text-center text-sm font-medium" style={{ color: 'var(--plum-600)' }}>
            Loading student records...
          </div>
        ) : (
          <div className="overflow-x-auto mb-6 max-h-[400px] overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--plum-200)' }}>
            <table className="w-full text-left border-collapse relative bg-white">
              <thead className="sticky top-0 shadow-sm" style={{ background: 'var(--plum-900)', color: 'white' }}>
                <tr>
                  <th className="p-4 text-xs uppercase tracking-wider font-medium">Student Name</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-medium text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="p-8 text-center text-sm text-gray-500">No students enrolled in this course yet.</td>
                  </tr>
                ) : (
                  attendanceList.map((record) => (
                    <tr key={record.student} className="border-b hover:bg-[var(--cream)] transition-colors" style={{ borderColor: 'var(--warm-gray)' }}>
                      <td className="p-4">
                        <p className="text-sm font-bold" style={{ color: 'var(--plum-950)' }}>{record.name}</p>
                        {record.rollNumber !== 'N/A' && (
                          <p className="text-xs font-medium" style={{ color: 'var(--plum-600)' }}>{record.rollNumber}</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStatus(record.student)}
                          className={`px-6 py-2 rounded-md text-xs font-bold transition-all border shadow-sm ${
                            record.status === 'Present' 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:shadow' 
                              : record.status === 'Leave' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:shadow'
                          }`}
                        >
                          {record.status}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving || fetchingDate || attendanceList.length === 0}
          className="w-full py-3.5 rounded-lg text-white text-sm font-bold tracking-wide transition-all hover:shadow-lg disabled:opacity-50"
          style={{ background: 'var(--plum-800)' }}
        >
          {saving ? 'Saving to Database...' : 'Save Register'}
        </button>
      </form>
    </div>
  );
}