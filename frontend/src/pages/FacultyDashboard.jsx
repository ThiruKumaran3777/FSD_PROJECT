import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://fsd-project-81bb.onrender.com';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pulseActive, setPulseActive] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/courses/mine`, { withCredentials: true });
        setCourses(res.data.courses);
        if (res.data.courses.length > 0) {
          setActiveCourseId(res.data.courses[0]._id);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!activeCourseId) return;

    const fetchFeedback = async () => {
      try {
        const res = await axios.get(`${API_BASE}/feedback/course/${activeCourseId}`, {
          withCredentials: true,
        });
        setFeedback(res.data.feedback || []);
        setMetrics(res.data.metrics || null);
      } catch {
        setFeedback([]);
        setMetrics(null);
      }
    };

    fetchFeedback();
  }, [activeCourseId]);

  useEffect(() => {
    const fetchRoster = async () => {
      if (activeTab !== 'roster' || !activeCourseId) return;
      setRosterLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/courses/${activeCourseId}/roster`, {
          withCredentials: true,
        });
        setRoster(res.data.roster || []);
      } catch {
        setRoster([]);
      } finally {
        setRosterLoading(false);
      }
    };

    fetchRoster();
  }, [activeTab, activeCourseId]);

  useEffect(() => {
    if (!activeCourseId) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join-course', activeCourseId);

    const handler = (payload) => {
      if (payload.courseId === activeCourseId) {
        setFeedback((prev) => [payload.feedback, ...prev]);
        setMetrics(payload.metrics);
        setNotifications((prev) => [...prev, { id: Date.now(), text: 'New feedback received', time: new Date() }]);
      }
    };

    socket.on('feedback:new', handler);

    return () => {
      socket.off('feedback:new', handler);
    };
  }, [activeCourseId]);

  const sentimentSummary = useMemo(() => {
    if (!metrics) return 'No feedback yet';
    return `${metrics.feedbackCount} responses · ${metrics.averageRating.toFixed(1)}/5 avg rating`;
  }, [metrics]);

  const handlePulseToggle = () => {
    if (!pulseActive) {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 5 * 60 * 1000);
    } else {
      setPulseActive(false);
    }
  };

  const handleOpenFeedbackLink = (course) => {
    const url = `/c/${course.code}/feedback`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course and its feedback? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/courses/${courseId}`, { withCredentials: true });
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      if (activeCourseId === courseId) {
        setActiveCourseId(null);
        setFeedback([]);
        setMetrics(null);
      }
    } catch {
    }
  };

  const handleRemoveFromRoster = async (studentId) => {
    if (!window.confirm('Remove this student from the roster?')) return;
    try {
      await axios.delete(`${API_BASE}/courses/${activeCourseId}/roster/${studentId}`, {
        withCredentials: true,
      });
      setRoster((prev) => prev.filter((s) => s.id !== studentId));
    } catch {
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account? You will be signed out immediately and this cannot be undone.')) {
      return;
    }
    setAccountDeleting(true);
    try {
      await axios.delete(`${API_BASE}/auth/me`, { withCredentials: true });
      await logout();
      window.location.href = '/signup';
    } catch {
      setAccountDeleting(false);
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ['Time', 'Rating', 'Sentiment', 'Comment'],
      ...feedback.map(f => [
        new Date(f.createdAt).toLocaleString(),
        f.rating,
        f.sentiment,
        f.comment || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${activeCourseId}-${Date.now()}.csv`;
    a.click();
  };

  const wordCloudKeywords = useMemo(() => {
    const counts = {};
    feedback.forEach((f) => {
      if (!f.comment) return;
      f.comment
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .forEach((w) => {
          counts[w] = (counts[w] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [feedback]);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">FEEDBACK STUDIO</p>
            <h1 className="text-sm font-medium text-white mt-1">
              {user?.name || 'Faculty'} · Live course feedback
            </h1>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-white rounded-full px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-black text-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex rounded-full bg-gray-900 p-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'roster', label: 'Roster' },
                  { id: 'settings', label: 'Settings' },
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        active
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === 'overview' && (
              <>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-1">
                      COURSES
                    </p>
                    <p className="text-sm text-gray-400">
                      Choose a course to see live responses or open a quick feedback link.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePulseToggle}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide ${
                        pulseActive
                          ? 'bg-emerald-500 text-black'
                          : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          pulseActive ? 'bg-black' : 'bg-gray-500'
                        }`}
                      />
                      Pulse check
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {loading && (
                    <p className="text-xs text-gray-500">Loading your courses…</p>
                  )}
                  {!loading && courses.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No courses yet. Create one via the admin interface.
                    </p>
                  )}
                  {courses.map((course) => {
                    const active = course._id === activeCourseId;
                    return (
                      <div
                        key={course._id}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs ${
                          active
                            ? 'bg-white text-black'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveCourseId(course._id)}
                          className="flex-1 text-left"
                        >
                          <p className={`font-medium ${active ? 'text-black' : 'text-white'}`}>
                            {course.code} · {course.title}
                          </p>
                          <p className={`text-[11px] ${active ? 'text-gray-600' : 'text-gray-500'}`}>
                            Click to focus live feed and analytics.
                          </p>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenFeedbackLink(course)}
                            className="px-2 py-1 rounded-full bg-gray-800 text-[11px] text-gray-300 hover:bg-gray-700"
                          >
                            Open link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course._id)}
                            className="px-2 py-1 rounded-full bg-red-900/30 text-[11px] text-red-400 hover:bg-red-900/50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <div className="mt-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-4">
                  ANALYTICS
                </p>
                {!activeCourseId && (
                  <p className="text-xs text-gray-500">
                    Select a course in the overview tab first.
                  </p>
                )}
                {activeCourseId && metrics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-900 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{metrics.feedbackCount}</div>
                        <div className="text-xs text-gray-500 mt-1">Total Responses</div>
                      </div>
                      <div className="bg-gray-900 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{metrics.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 mt-1">Avg Rating</div>
                      </div>
                      <div className="bg-gray-900 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          {metrics.positivePercentage ? `${metrics.positivePercentage}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Positive</div>
                      </div>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="w-full bg-white text-black rounded-xl px-4 py-2 text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Export Data as CSV
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roster' && (
              <div className="mt-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                  ROSTER
                </p>
                {!activeCourseId && (
                  <p className="text-xs text-gray-500">
                    Select a course in the overview tab first.
                  </p>
                )}
                {activeCourseId && rosterLoading && (
                  <p className="text-xs text-gray-500">Loading roster…</p>
                )}
                {activeCourseId && !rosterLoading && roster.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Once students submit feedback, they will appear here.
                  </p>
                )}
                {activeCourseId && roster.length > 0 && (
                  <ul className="divide-y divide-gray-800 rounded-xl bg-gray-900">
                    {roster.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-medium text-white">{entry.name}</p>
                          <p className="text-[11px] text-gray-500">{entry.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromRoster(entry.id)}
                          className="px-2 py-1 rounded-full bg-gray-800 text-[11px] text-gray-400 hover:bg-gray-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="mt-2 space-y-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-1">
                  SETTINGS
                </p>
                <p className="text-xs text-gray-400">
                  Manage your account. Deleting your account will sign you out immediately.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={accountDeleting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-900/30 px-3 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-60"
                >
                  {accountDeleting ? 'Deleting account…' : 'Delete my account'}
                </button>
              </div>
            )}
          </div>

          {activeTab === 'overview' && (
            <div className="bg-black text-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-1">
                    LIVE FEED
                  </p>
                  <p className="text-sm text-gray-400">Newest comments first.</p>
                </div>
                <p className="text-[11px] text-gray-500">{sentimentSummary}</p>
              </div>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {feedback.length === 0 && (
                  <p className="text-xs text-gray-500">
                    You'll see feedback stream in here as students respond.
                  </p>
                )}
                {feedback.map((item) => (
                  <article
                    key={item.id || item._id}
                    className="rounded-xl px-3.5 py-2.5 bg-gray-900"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] text-gray-500">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">
                          {item.rating.toFixed ? item.rating.toFixed(1) : item.rating}/5
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            item.sentiment === 'Positive'
                              ? 'bg-emerald-900/30 text-emerald-400'
                              : item.sentiment === 'Negative'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                    </div>
                    {item.comment && (
                      <p className="text-xs text-gray-300 leading-relaxed">{item.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="bg-black text-white rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              NOTIFICATIONS
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-xs text-gray-500">No new notifications</p>
              )}
              {notifications.slice(-5).reverse().map((notif) => (
                <div key={notif.id} className="text-xs text-gray-400 bg-gray-900 rounded-lg px-2 py-1.5">
                  {notif.text}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              AI SUMMARY
            </p>
            <p className="text-sm text-gray-400 mb-3">
              A future AI assistant will condense themes from the last 30 minutes of feedback into
              a brief, actionable summary.
            </p>
            <div className="rounded-xl px-4 py-3 bg-gray-900">
              <p className="text-xs text-gray-500">
                "Students are responding well to the pace but asking for more worked examples on
                dynamic programming. Consider pausing after each concept for a short, guided
                exercise."
              </p>
            </div>
          </div>

          <div className="bg-black text-white rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 mb-3">
              WORD CLOUD
            </p>
            <div className="flex flex-wrap gap-1.5">
              {wordCloudKeywords.length === 0 && (
                <p className="text-xs text-gray-500">
                  Once comments start flowing in, common keywords will appear here.
                </p>
              )}
              {wordCloudKeywords.map(([word, count]) => (
                <span
                  key={word}
                  className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-1 text-[11px] text-gray-400"
                  style={{
                    fontSize: `${11 + Math.min(count, 4) * 1.2}px`,
                  }}
                >
                  {word}
                  <span className="ml-1 text-[9px] text-gray-600">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default FacultyDashboard;
