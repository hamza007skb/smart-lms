import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentSubmission() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { authFetch, token } = useAuth();

  const courseName = location.state?.courseName || 'Classroom';
  const teacherName = location.state?.teacherName || 'Instructor';

  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        // 1. Fetch the Assignment Details
        const assignRes = await authFetch(`/api/assignments/single/${assignmentId}`);
        if (assignRes.ok) {
          setAssignment(await assignRes.json());
        }

        // 2. Check if the student already submitted this
        const checkRes = await authFetch(`/api/submissions/check/${assignmentId}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.submitted) {
            setExistingSubmission(checkData.submission);
          }
        }
      } catch (error) {
        console.error("Failed to load assignment data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignmentData();
  }, [assignmentId, authFetch]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !(/\.(pdf|docx)$/i.test(selectedFile.name))) {
      setStatusMsg({ type: 'error', text: 'Invalid format. Please upload a PDF or DOCX file.' });
      setFile(null);
      e.target.value = null;
      return;
    }
    setFile(selectedFile);
    setStatusMsg({ type: '', text: '' });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatusMsg({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    if (!token) {
      setStatusMsg({ type: 'error', text: 'Session error: No token found. Please re-login.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    // Create the FormData container for the file payload
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('courseId', assignment.course?._id || assignment.course); // The missing puzzle piece!
    formData.append('file', file);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setExistingSubmission(data.submission || data);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || `Upload failed with status: ${res.status}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatusMsg({ type: 'error', text: error.message || 'Failed to submit assignment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-[var(--plum-500)]">Loading assignment details...</div>;
  if (!assignment) return <div className="p-8 text-red-600">Assignment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm font-medium text-[var(--plum-600)] hover:opacity-70">
        ← Back to Course Stream
      </button>

      <div className="p-8 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--plum-200)' }}>

        {/* Header Details */}
        <div className="mb-6 pb-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ borderColor: 'var(--warm-gray)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[var(--plum-100)] text-2xl">
              📄
            </div>
            <div>
              <h1 className="font-serif text-2xl mb-1" style={{ color: 'var(--plum-950)' }}>{assignment.title}</h1>
              <p className="text-sm font-medium" style={{ color: 'var(--plum-600)' }}>
                {courseName} • Prof. {teacherName}
              </p>
            </div>
          </div>

          <div className="text-right bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-0.5">Deadline</p>
            <p className="text-sm font-medium text-orange-600">
              {new Date(assignment.deadline).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--plum-700)' }}>Instructions</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--plum-900)' }}>
            {assignment.description || "No additional instructions provided. Please upload your document in PDF format below."}
          </p>

          {/* THE NEW ATTACHMENT DISPLAY BLOCK */}
          {assignment.attachmentUrl && (
            <div className="mt-4 p-4 bg-[var(--plum-100)] rounded-lg border inline-block" style={{ borderColor: 'var(--plum-200)' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--plum-800)' }}>Reference Material</p>
              <a
                href={`/${assignment.attachmentUrl.replace(/\\/g, '/')}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--plum-900)' }}
              >
                📎 Download Attachment
              </a>
            </div>
          )}
        </div>

        {/* LOGIC SPLIT: Show Success Card OR Upload Form */}
        {existingSubmission ? (
          <div className="p-6 rounded-lg bg-green-50 border border-green-200 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-serif text-xl mb-1 text-green-900">Successfully Turned In</h3>
            <p className="text-sm my-2">{new Date(existingSubmission.createdAt) > new Date(assignment.deadline) ? "Submitted late" : "Submitted on time"}</p>
            {existingSubmission.similarityScore == null && <p className="text-sm">Similarity analysis unavailable; your file is saved.</p>}
            <p className="text-sm text-green-700 mb-4">You have already submitted your work for this assignment.</p>

            {/* Display similarity score if the AI has processed it! */}
            {existingSubmission.similarityScore != null && (
              <div className="inline-block px-4 py-2 bg-white rounded-md border border-green-200 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-green-800 mr-2">AI Similarity Score:</span>
                <span className="text-lg font-bold text-green-700">{existingSubmission.similarityScore}%</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-lg bg-[var(--cream)] border border-dashed" style={{ borderColor: 'var(--plum-300)' }}>
            <h3 className="font-serif text-lg mb-4" style={{ color: 'var(--plum-900)' }}>Your Work</h3>

            <div className="mb-4">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-[var(--plum-600)]
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--plum-800)] file:text-white
                  hover:file:bg-[var(--plum-900)] cursor-pointer"
              />
              <p className="text-xs mt-2" style={{ color: 'var(--plum-500)' }}>* PDF and DOCX files are accepted for the AI Plagiarism Check.</p>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-md text-sm mb-4 border ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {statusMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--plum-900)' }}
            >
              {submitting ? 'Uploading & Analyzing...' : 'Turn In Assignment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
