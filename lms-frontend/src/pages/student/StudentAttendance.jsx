import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendance() {
  const { id } = useParams(); // Course ID
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Fetch real data from the backend for this specific course
        const res = await authFetch(`/api/attendance/student/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAttendanceData(data);
        } else {
          console.error("Failed to fetch attendance records");
        }
      } catch (error) {
        console.error("Error loading attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [id, authFetch]);

  // Calculate percentage
  const totalClasses = attendanceData.length;
  const leaveClasses = attendanceData.filter(r => r.status === 'Leave').length;
  const presentClasses = attendanceData.filter(r => r.status === 'Present').length;
  const percentage = totalClasses === 0 ? 0 : Math.round((presentClasses / (totalClasses - leaveClasses || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm font-medium text-[var(--plum-600)] hover:opacity-70">
        ← Back to Course Stream
      </button>

      <div className="p-8 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--plum-200)' }}>
        <h1 className="font-serif text-3xl mb-6" style={{ color: 'var(--plum-950)' }}>Attendance Record</h1>
        
        {/* Stats Card */}
        <div className="flex items-center gap-6 p-6 rounded-lg mb-8" style={{ background: 'var(--cream)', border: '1px solid var(--plum-100)' }}>
          <div className="text-center p-4 bg-white rounded-full w-24 h-24 flex flex-col justify-center items-center shadow-sm border" style={{ borderColor: 'var(--plum-200)' }}>
            <span className="text-2xl font-bold" style={{ color: percentage >= 75 ? 'green' : 'red' }}>
              {percentage}%
            </span>
          </div>
          <div>
            <h3 className="font-medium text-lg" style={{ color: 'var(--plum-900)' }}>Total Classes: {totalClasses}</h3>
            <p className="text-sm" style={{ color: 'var(--plum-600)' }}>Classes Attended: {presentClasses} · Approved leave: {leaveClasses}</p>
            <p className="text-xs text-gray-500">Approved leave is excluded from the attendance percentage.</p>
            {percentage < 75 && totalClasses > 0 && (
              <p className="text-xs font-bold text-red-600 mt-2">Warning: Your attendance is below the 75% requirement.</p>
            )}
          </div>
        </div>

        {/* History Table */}
        <h2 className="font-serif text-xl mb-4" style={{ color: 'var(--plum-900)' }}>Daily History</h2>
        {loading ? (
          <p className="text-sm text-[var(--plum-500)]">Loading records...</p>
        ) : attendanceData.length === 0 ? (
          <p className="text-sm text-[var(--plum-500)] p-6 text-center border-2 border-dashed rounded-xl border-[var(--plum-200)]">
            No attendance records found for this class yet.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--plum-100)', color: 'var(--plum-800)' }}>
                <th className="p-3 text-xs uppercase tracking-wider">Date</th>
                <th className="p-3 text-xs uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => (
                <tr key={index} className="border-b hover:bg-[var(--cream)] transition-colors" style={{ borderColor: 'var(--warm-gray)' }}>
                  <td className="p-3 text-sm font-medium" style={{ color: 'var(--plum-900)' }}>
                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-3 text-sm text-right font-bold" style={{ color: record.status === 'Present' ? 'green' : record.status === 'Leave' ? '#92400e' : 'red' }}>
                    {record.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}