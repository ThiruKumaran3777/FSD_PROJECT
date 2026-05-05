import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://fsd-project-81bb.onrender.com';

const QuickFeedbackPage = () => {
  const { courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ rating: 4, comment: '' });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`${API_BASE}/courses/code/${courseCode}`);
        setCourse(res.data.course);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseCode]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/feedback/public`, {
        courseCode,
        rating: Number(form.rating),
        comment: form.comment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-600 tracking-wide">Preparing feedback card…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-black text-white rounded-2xl px-8 py-6 max-w-md w-full text-center">
          <p className="text-sm font-medium text-white mb-1">Course not found</p>
          <p className="text-xs text-gray-400">
            The link may be expired or the course code is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full bg-black text-white rounded-2xl px-8 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
            THANK YOU
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
            Feedback received
          </h1>
          <p className="text-sm text-gray-400">
            Your response is anonymous and helps{' '}
            <span className="font-medium text-white">{course.faculty?.name}</span> refine{' '}
            <span className="font-medium text-white">{course.title}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full bg-black text-white rounded-2xl px-7 py-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
            QUICK FEEDBACK
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {course.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {course.code} · {course.faculty?.name}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-400 mb-2">
              Overall experience today
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
                  className={`flex-1 text-xs py-2 rounded-xl transition-colors ${
                    form.rating === value
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-400 mb-2">
              One thing we could improve
            </label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white resize-none"
              placeholder="Short, honest, and specific is perfect."
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex justify-center items-center rounded-xl bg-white text-black text-sm font-medium tracking-wide py-2.5 mt-1 transition-colors hover:bg-gray-200 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send anonymous feedback'}
          </button>

          <p className="text-[11px] text-gray-500 text-center mt-2">
            We never store your identity with this response.
          </p>
        </form>
      </div>
    </div>
  );
};

export default QuickFeedbackPage;
