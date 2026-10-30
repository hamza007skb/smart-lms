import CourseLearning from '../../components/shared/CourseLearning';
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import CreateAssignment from "../../pages/teacher/CreateAssignment";

export default function ManageCourse() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { authFetch, token } = useAuth();  
  // UI States
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  
  // EDIT ASSIGNMENT STATES
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editFile, setEditFile] = useState(null); // Added for file uploads
  const [savingEdit, setSavingEdit] = useState(false);

  // EDIT ANNOUNCEMENT STATES
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editAnnouncementContent, setEditAnnouncementContent] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Data States
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]); 
  const [announcements, setAnnouncements] = useState([]);
  
  // Form States
  const [announcementContent, setAnnouncementContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseRes = await authFetch(`/api/courses/${id}`);
        if (courseRes.ok) setCourse(await courseRes.json());

        const assignRes = await authFetch(`/api/assignments/${id}`);
        if (assignRes.ok) setAssignments(await assignRes.json());

        const annRes = await authFetch(`/api/announcements/${id}`);
        if (annRes.ok) setAnnouncements(await annRes.json());

      } catch (error) {
        console.error("Failed to load course data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, authFetch]);

  // ==========================================
  // ANNOUNCEMENT LOGIC
  // ==========================================
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;
    
    setPosting(true);
    try {
      const res = await authFetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id, content: announcementContent })
      });

      if (res.ok) {
        const data = await res.json();
        setAnnouncements([data.announcement, ...announcements]); 
        setAnnouncementContent(""); 
        setIsAddingAnnouncement(false); 
      }
    } catch (error) {
      console.error("Failed to post announcement", error);
    } finally {
      setPosting(false);
    }
  };

  const startEditingAnnouncement = (announcement) => {
    setEditingAnnouncementId(announcement._id);
    setEditAnnouncementContent(announcement.content);
  };

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncementId(null);
    setEditAnnouncementContent("");
  };

  const handleSaveAnnouncementEdit = async (announcementId) => {
    setSavingAnnouncement(true);
    try {
      const res = await authFetch(`/api/announcements/${announcementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editAnnouncementContent })
      });

      if (res.ok) {
        const updatedAnnouncement = await res.json();
        setAnnouncements(announcements.map(a => a._id === announcementId ? updatedAnnouncement : a));
        cancelEditingAnnouncement();
      } else {
        alert("Failed to update announcement.");
      }
    } catch (error) {
      console.error("Error saving announcement edit", error);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // ==========================================
  // ASSIGNMENT EDIT LOGIC
  // ==========================================
  const startEditing = (assignment) => {
    setEditingAssignmentId(assignment._id);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description || "");
    setEditFile(null); // Reset the file selector
    
    // Convert DB date to format required by <input type="datetime-local">
    if (assignment.deadline) {
      const dateObj = new Date(assignment.deadline);
      const tzoffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dateObj.getTime() - tzoffset).toISOString().slice(0, 16);
      setEditDeadline(localISOTime);
    } else {
      setEditDeadline("");
    }
  };

  const cancelEditing = () => {
    setEditingAssignmentId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDeadline("");
    setEditFile(null);
  };

 const handleSaveEdit = async (assignmentId) => {
    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('deadline', editDeadline);
      
      if (editFile) {
        formData.append('file', editFile);
      }

      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData 
      });

      if (res.ok) {
        const updatedAssignment = await res.json();
        setAssignments(assignments.map(a => a._id === assignmentId ? updatedAssignment : a));
        cancelEditing(); 
      } else {
        const errorData = await res.json();
        alert(`Failed to update assignment: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error saving edit", error);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-[var(--plum-600)]">Loading course details...</div>;
  if (!course) return <div className="p-8 text-red-600 font-bold">Course not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <button onClick={() => navigate(-1)} className="mb-6 text-sm font-bold tracking-wide text-[var(--plum-600)] hover:underline">
        ← BACK TO DASHBOARD
      </button>

      <div className="flex flex-col md:flex-row items-start justify-between mb-8 p-8 rounded-xl shadow-sm gap-6" style={{ background: "white", border: "1px solid var(--plum-200)" }}>
        <div className="flex-1">
          <h1 className="font-serif text-3xl mb-2" style={{ color: "var(--plum-950)" }}>
            {course.name}
          </h1>
          <p className="text-sm font-medium" style={{ color: "var(--plum-600)" }}>
            {course.description || "No description provided."}
          </p>
        </div>
        <div className="text-center p-5 rounded-lg bg-[var(--cream)] border shadow-inner min-w-[200px]" style={{ borderColor: "var(--plum-200)" }}>
          <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: "var(--plum-700)" }}>
            Class Join Code
          </p>
          <p className="text-3xl font-mono font-bold" style={{ color: "var(--plum-950)" }}>
            {course.joinCode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Announcements & Assignments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* --- ANNOUNCEMENTS MODULE --- */}
          <div className="p-6 rounded-xl shadow-sm" style={{ background: "white", border: "1px solid var(--plum-100)" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl" style={{ color: "var(--plum-900)" }}>Class Stream</h2>
              {!isAddingAnnouncement && (
                <button onClick={() => setIsAddingAnnouncement(true)} className="px-4 py-2 rounded-md text-white text-xs font-bold transition-all shadow-sm hover:shadow" style={{ background: "var(--plum-700)" }}>
                  + Post Announcement
                </button>
              )}
            </div>

            {isAddingAnnouncement && (
              <form onSubmit={handlePostAnnouncement} className="mb-6 p-4 rounded-lg border bg-[var(--cream)] shadow-inner" style={{ borderColor: "var(--plum-200)" }}>
                <textarea
                  required
                  rows="3"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Announce something to your class..."
                  className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--plum-300)] mb-3"
                ></textarea>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddingAnnouncement(false)} className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={posting} className="px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm" style={{ background: "var(--plum-800)" }}>
                    {posting ? "Posting..." : "Post Announcement"}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann._id} className="p-5 rounded-lg border bg-white hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--warm-gray)' }}>
                    
                    {editingAnnouncementId === ann._id ? (
                      // EDIT ANNOUNCEMENT FORM
                      <div className="flex flex-col gap-3">
                        <textarea
                          rows="3"
                          value={editAnnouncementContent}
                          onChange={(e) => setEditAnnouncementContent(e.target.value)}
                          className="w-full p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--plum-300)]"
                        ></textarea>
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEditingAnnouncement} className="px-3 py-1.5 text-xs font-bold text-gray-500">Cancel</button>
                          <button 
                            onClick={() => handleSaveAnnouncementEdit(ann._id)} 
                            disabled={savingAnnouncement}
                            className="px-4 py-1.5 rounded text-white text-xs font-bold bg-green-600 hover:bg-green-700"
                          >
                            {savingAnnouncement ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // DISPLAY ANNOUNCEMENT
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum-500)' }}>
                            {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <button 
                            onClick={() => startEditingAnnouncement(ann)}
                            className="text-[10px] uppercase font-bold text-gray-400 hover:text-gray-700 border px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--plum-950)' }}>
                          {ann.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm font-medium italic border-2 border-dashed rounded-lg" style={{ borderColor: "var(--plum-100)", color: "var(--plum-400)" }}>
                  No announcements yet.
                </div>
              )}
            </div>
          </div>

          {/* --- ASSIGNMENTS MODULE --- */}
          <div className="p-6 rounded-xl shadow-sm" style={{ background: "white", border: "1px solid var(--plum-100)" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl" style={{ color: "var(--plum-900)" }}>Assignments</h2>
              {!isAddingAssignment && (
                <button onClick={() => setIsAddingAssignment(true)} className="px-4 py-2 rounded-md text-white text-xs font-bold transition-all shadow-sm hover:shadow" style={{ background: "var(--plum-700)" }}>
                  + Create Assignment
                </button>
              )}
            </div>
            
            {isAddingAssignment ? (
              <CreateAssignment
                courseId={id}
                onCancel={() => setIsAddingAssignment(false)}
                onSuccess={(newAssignment) => {
                  setIsAddingAssignment(false);
                  setAssignments([newAssignment, ...assignments]);
                }}
              />
            ) : assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="p-5 rounded-lg border bg-white hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--warm-gray)' }}>
                    
                    {editingAssignmentId === assignment._id ? (
                      // EDIT ASSIGNMENT FORM
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Title</label>
                          <input 
                            type="text" 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--plum-400)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Description (Optional)</label>
                          <textarea 
                            rows="2"
                            value={editDescription} 
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--plum-400)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Deadline</label>
                          <input 
                            type="datetime-local" 
                            value={editDeadline} 
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--plum-400)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Replace Attachment (Optional)</label>
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setEditFile(e.target.files[0])}
                            className="w-full p-2 border rounded text-sm bg-gray-50"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep the current file.</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 pt-4 border-t">
                          <button onClick={cancelEditing} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800">Cancel</button>
                          <button 
                            onClick={() => handleSaveEdit(assignment._id)} 
                            disabled={savingEdit}
                            className="px-5 py-2 rounded text-white text-xs font-bold bg-green-600 hover:bg-green-700 shadow-sm"
                          >
                            {savingEdit ? "Saving Changes..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // NORMAL ASSIGNMENT VIEW
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-base" style={{ color: 'var(--plum-950)' }}>{assignment.title}</h4>
                          <p className="text-xs mt-1 font-bold" style={{ color: 'var(--plum-600)' }}>
                            Due: {new Date(assignment.deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {assignment.description && (
                            <p className="text-sm mt-2 text-gray-600">{assignment.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => startEditing(assignment)}
                            className="flex-1 sm:flex-none text-xs px-4 py-2 rounded-md font-bold transition-colors text-gray-600 border border-gray-200 hover:bg-gray-50 text-center"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => navigate(`/teacher/assignment/${assignment._id}/submissions`)}
                            className="flex-1 sm:flex-none text-xs px-4 py-2 rounded-md font-bold transition-colors shadow-sm text-center" 
                            style={{ background: 'var(--cream)', color: 'var(--plum-800)', border: '1px solid var(--plum-200)' }}
                          >
                            Submissions →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm font-medium italic border-2 border-dashed rounded-lg" style={{ borderColor: "var(--plum-100)", color: "var(--plum-400)" }}>
                No assignments created yet.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Students & Grades */}
        <div className="p-8 rounded-xl shadow-sm h-fit sticky top-6" style={{ background: "white", border: "1px solid var(--plum-200)" }}>
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 border-b pb-4" style={{ borderColor: 'var(--plum-100)' }}>
            <h2 className="font-serif text-xl" style={{ color: "var(--plum-950)" }}>
              Enrolled Students <span className="text-sm text-gray-400">({course.students?.length || 0})</span>
            </h2>
            
            <button 
              onClick={() => navigate(`/teacher/course/${id}/grades`)} 
              className="px-4 py-2 rounded-lg border shadow-sm text-xs font-bold transition-colors w-full xl:w-auto text-center" 
              style={{ borderColor: 'var(--plum-300)', color: 'var(--plum-800)', background: 'var(--cream)' }}
            >
              Manage Grades ↗
            </button>
          </div>

          {course.students?.length === 0 ? (
            <p className="text-sm p-6 text-center border-2 border-dashed rounded-lg font-medium" style={{ borderColor: 'var(--plum-200)', color: "var(--plum-500)" }}>
              No students enrolled yet.
            </p>
          ) : (
            <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {course.students.map((student, i) => (
                <li key={i} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'var(--warm-gray)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--plum-950)' }}>
                      {student.name || "Unknown Student"}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-bold mt-1" style={{ color: 'var(--plum-600)' }}>
                      {student.rollNumber ? student.rollNumber : "ID: " + String(student._id).substring(0, 8)}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'var(--plum-100)', color: 'var(--plum-800)'}}>
                    {student.name ? student.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <CourseLearning courseId={id} />
    </div>
  );
}