import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CreateAssignment({ courseId, onCancel, onSuccess }) {
  const { token } = useAuth(); // Safely grab the login token
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalMarks, setTotalMarks] = useState(10);
  const [file, setFile] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    // 1. Pack the data into FormData
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', deadline);
    formData.append('totalMarks', totalMarks);
    
    if (file) {
      formData.append('file', file);
    }

    try {
      // 2. Send the request
      const res = await fetch('/api/assignments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO Content-Type! Let the browser handle the boundaries.
        },
        body: formData
      });

      if (res.ok) {
        const newAssignment = await res.json();
        onSuccess(newAssignment); // Instantly adds it to the UI and closes the form!
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to create assignment.");
      }
    } catch (err) {
      console.error("Creation error:", err);
      setErrorMsg("A network error occurred. Please check your backend terminal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 mb-8 rounded-xl border bg-[var(--cream)]" style={{ borderColor: 'var(--plum-300)' }}>
      <h3 className="font-serif text-xl mb-4" style={{ color: 'var(--plum-900)' }}>Create New Assignment</h3>
      
      {errorMsg && (
        <div className="p-3 mb-4 rounded bg-red-50 text-red-700 border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--plum-800)' }}>Title</label>
            <input 
              type="text" required
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Final Project Proposal"
              className="w-full p-2 border rounded focus:outline-none focus:border-[var(--plum-500)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--plum-800)' }}>Deadline</label>
              <input 
                type="datetime-local" required
                value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-[var(--plum-500)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--plum-800)' }}>Total Marks</label>
              <input 
                type="number" min="1" required
                value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:border-[var(--plum-500)] text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--plum-800)' }}>Instructions (Optional)</label>
          <textarea 
            rows="3"
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide instructions for the students..."
            className="w-full p-2 border rounded focus:outline-none focus:border-[var(--plum-500)] text-sm"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--plum-800)' }}>Reference Document (Optional)</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-[var(--plum-600)]
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-xs file:font-bold file:uppercase file:tracking-wider
              file:bg-[var(--plum-200)] file:text-[var(--plum-900)]
              hover:file:bg-[var(--plum-300)] cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--plum-200)' }}>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2 rounded-lg text-white text-sm font-bold shadow transition-all disabled:opacity-50"
            style={{ background: 'var(--plum-800)' }}
          >
            {saving ? 'Saving...' : 'Post Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}