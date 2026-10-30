import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CreateCourse() {
  const { authFetch } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCourse, setCreatedCourse] = useState(null); // Holds the generated code

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send the data to your Node.js backend using your secure fetch helper
      const res = await authFetch('/api/courses/create', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      // Success! Save the returned course data (which includes the new join code)
      setCreatedCourse(data.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If the course was just created, show the Success Screen with the Join Code
  if (createdCourse) {
    return (
      <div className="p-8 rounded-xl" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: 'var(--plum-100)', color: 'var(--plum-800)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif mb-2" style={{ color: 'var(--plum-950)' }}>Course Created Successfully!</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--plum-600)' }}>Share this unique code with your students so they can enroll.</p>
          
          <div className="p-6 rounded-lg mb-6 border-2 border-dashed" style={{ borderColor: 'var(--plum-300)', background: 'white' }}>
            <span className="text-4xl font-mono tracking-widest font-bold" style={{ color: 'var(--plum-900)' }}>
              {createdCourse.joinCode}
            </span>
          </div>

          <button 
            onClick={() => setCreatedCourse(null)} // Reset form to create another
            className="text-sm font-medium underline underline-offset-4" style={{ color: 'var(--plum-700)' }}
          >
            Create another course
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the default Creation Form
  return (
    <div className="p-8 rounded-xl shadow-sm" style={{ background: 'white', border: '1px solid var(--plum-100)' }}>
      <h2 className="text-2xl font-serif mb-2" style={{ color: 'var(--plum-950)' }}>Create New Course</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--plum-600)' }}>Generate a new classroom and invite code for your students.</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: 'var(--plum-700)' }}>
            Course Name
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Intro to Programming"
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
            style={{ background: 'var(--cream)', border: '1.5px solid transparent', color: 'var(--plum-950)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--plum-300)')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: 'var(--plum-700)' }}>
            Short Description (Optional)
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="What will students learn in this class?"
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all resize-none"
            style={{ background: 'var(--cream)', border: '1.5px solid transparent', color: 'var(--plum-950)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--plum-300)')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-medium text-sm tracking-wide transition-all disabled:opacity-60"
          style={{ background: loading ? 'var(--plum-400)' : 'var(--plum-800)', color: 'white' }}
        >
          {loading ? 'Generating Code...' : 'Create Course & Generate Code →'}
        </button>
      </form>
    </div>
  );
}