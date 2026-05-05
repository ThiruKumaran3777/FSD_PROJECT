import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://fsd-project-81bb.onrender.com';

const MOCK_COURSES = [
    { _id: '1', code: 'CS101', title: 'Intro to Computer Science', instructor: 'Prof. Smith', videoUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E', thumbnail: 'https://img.youtube.com/vi/zOjov-2OZ0E/hqdefault.jpg' },
    { _id: '2', code: 'CS201', title: 'Data Structures & Algos', instructor: 'Dr. Johnson', videoUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', thumbnail: 'https://img.youtube.com/vi/RBSGKlAvoiM/hqdefault.jpg' },
    { _id: '3', code: 'CS301', title: 'Web Development Bootcamp', instructor: 'Prof. Williams', videoUrl: 'https://www.youtube.com/watch?v=Nu_p71y56M0', thumbnail: 'https://img.youtube.com/vi/Nu_p71y56M0/hqdefault.jpg' },
    { _id: '4', code: 'CS401', title: 'Machine Learning Basics', instructor: 'Dr. Brown', videoUrl: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI', thumbnail: 'https://img.youtube.com/vi/Gv9_4yMHFhI/hqdefault.jpg' },
    { _id: '5', code: 'CS501', title: 'Cybersecurity Fundamentals', instructor: 'Prof. Davis', videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA', thumbnail: 'https://img.youtube.com/vi/inWWhr5tnEA/hqdefault.jpg' },
];

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [courses] = useState(MOCK_COURSES);
    const [myCourses, setMyCourses] = useState(MOCK_COURSES.slice(0, 3));
    const [activeClassroom, setActiveClassroom] = useState(null);
    const [resources] = useState([
        { id: 1, title: "Data Structures Cheatsheet", type: "PDF", size: "2.4 MB", date: "2 days ago" },
        { id: 2, title: "React Best Practices 2024", type: "Video", size: "15 mins", date: "1 week ago" },
        { id: 3, title: "System Design Interview Guide", type: "Link", size: "External", date: "3 weeks ago" },
        { id: 4, title: "Algorithm Visualization Tool", type: "Tool", size: "Web", date: "1 month ago" },
    ]);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');

    const [feedbackHistory, setFeedbackHistory] = useState([
        { id: 1, course: 'CS101', title: 'Intro to Computer Science', rating: 4, comment: 'Great explanation of binary trees, but the traversal part was a bit fast.', date: '2 days ago' },
        { id: 2, course: 'CS201', title: 'Data Structures & Algos', rating: 5, comment: 'Excellent lecture on sorting algorithms. Very clear examples.', date: '1 week ago' },
        { id: 3, course: 'CS301', title: 'Web Development', rating: 3, comment: 'Good content but could use more hands-on exercises.', date: '2 weeks ago' },
    ]);
    const [newFeedback, setNewFeedback] = useState({ course: '', rating: 0, comment: '' });
    const [feedbackFormVisible, setFeedbackFormVisible] = useState(false);

    const handleJoinCourse = (course) => {
        if (!myCourses.find(c => c._id === course._id)) {
            setMyCourses([...myCourses, course]);
        }
        setActiveClassroom(course);
        setActiveTab('CLASSROOM');
    };

    const handleSubmitFeedback = async () => {
        if (!rating) {
            setFeedbackMessage('Please select a rating');
            return;
        }

        setFeedbackSubmitting(true);
        setFeedbackMessage('');

        try {
            await axios.post(`${API_BASE}/feedback/public`, {
                courseCode: activeClassroom.code,
                rating,
                comment,
            });
            setFeedbackMessage('Feedback submitted successfully!');
            setRating(0);
            setComment('');
        } catch (err) {
            setFeedbackMessage(err?.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMessage('');

        try {
            await axios.put(`${API_BASE}/auth/me`, profileForm, { withCredentials: true });
            setProfileMessage('Profile updated successfully!');
        } catch (err) {
            setProfileMessage(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleAddFeedback = () => {
        if (!newFeedback.course || !newFeedback.rating) {
            alert('Please select a course and rating');
            return;
        }
        const feedback = {
            id: Date.now(),
            course: newFeedback.course,
            title: myCourses.find(c => c.code === newFeedback.course)?.title || '',
            rating: newFeedback.rating,
            comment: newFeedback.comment,
            date: 'Just now'
        };
        setFeedbackHistory([feedback, ...feedbackHistory]);
        setNewFeedback({ course: '', rating: 0, comment: '' });
        setFeedbackFormVisible(false);
    };

    const handleDownloadResource = (resource) => {
        const content = `Resource: ${resource.title}\nType: ${resource.type}\nSize: ${resource.size}\nDate: ${resource.date}\n\nThis is a sample download for ${resource.title}.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resource.title.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderContent = () => {
        if (activeTab === 'DASHBOARD') {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-black text-white rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4.001zM11.5 16.79v-2.06a8.96 8.96 0 005.17-2.333c.365 2.155-.7 4.1-2.9 4.354a1 1 0 01-1.12-.907 8.955 8.955 0 00-1.15-1.054z"></path></svg>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black mb-2 text-white">Welcome back, {user?.name.split(' ')[0]}</h2>
                                <p className="text-gray-400 mb-6">You have 3 lectures to catch up on this week.</p>
                                <button onClick={() => setActiveTab('COURSES')} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                    Continue Learning
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-black mb-4">My Courses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myCourses.map(course => (
                                    <div key={course._id} onClick={() => { setActiveClassroom(course); setActiveTab('CLASSROOM'); }} className="card hover:bg-gray-900 cursor-pointer group">
                                        <div className="h-32 mb-4 rounded-xl overflow-hidden relative bg-gray-800">
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"></path><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 bg-white text-black text-[10px] px-2 py-1 rounded font-bold">
                                                CONTINUE
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-white truncate">{course.title}</h4>
                                        <p className="text-xs text-gray-400">{course.code} • {course.instructor}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Weekly Goal</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-bold text-white">12 hrs</span>
                                <span className="text-sm text-gray-400">/ 15 hrs</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full w-[80%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-bold text-white mb-4">Quick Links</h3>
                            <div className="space-y-2">
                                {['Academic Calendar', 'Library Portal', 'Exam Schedule', 'Support'].map(link => (
                                    <button key={link} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-900 text-sm font-medium text-gray-400 hover:text-white transition-colors flex justify-between items-center group">
                                        {link}
                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'COURSES') {
            return (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-black">Course Catalog</h2>
                            <p className="text-gray-600 mt-1">Explore and enroll in new classes.</p>
                        </div>
                        <div className="relative">
                            <input type="text" placeholder="Search topics..." className="input-premium pl-10 w-64" />
                            <svg className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course._id} className="card p-0 overflow-hidden hover:bg-gray-900 transition-all duration-300 group">
                                <div className="relative h-48 bg-gray-800">
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pl-1 transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                                            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                        </div>
                                    </button>
                                    <div className="absolute top-3 left-3 bg-white text-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                                        {course.code}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-lg text-white mb-1">{course.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{course.instructor}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-700"></div>)}
                                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-400">+42</div>
                                        </div>
                                        <button onClick={() => handleJoinCourse(course)} className="btn-primary text-xs py-2 px-4">
                                            {myCourses.find(c => c._id === course._id) ? 'Resume' : 'Enroll Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'CLASSROOM' && activeClassroom) {
            const videoId = getYoutubeId(activeClassroom.videoUrl);

            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-2">
                        <div className="bg-black rounded-2xl overflow-hidden aspect-video mb-6 relative group">
                            {videoId ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                    title={activeClassroom.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <p>No video content available.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-black">{activeClassroom.title}</h2>
                                <p className="text-gray-600 mt-1">{activeClassroom.code} • {activeClassroom.instructor}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-black pb-4">Lecture Notes</h3>
                            <p className="text-gray-700 leading-relaxed">
                                In this lecture, we cover the fundamental principles of {activeClassroom.title}.
                                Please review the attached PDF materials for a detailed breakdown of the algorithms discussed.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="card sticky top-24">
                            <h3 className="font-bold text-white mb-6">Live Feedback</h3>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">How's the pacing?</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setRating(v)}
                                            className={`flex-1 aspect-square rounded-lg font-bold text-sm transition-all ${rating >= v ? 'bg-white text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <textarea
                                    className="w-full bg-gray-900 text-white rounded-xl px-3 py-2.5 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="Ask a question or leave a comment..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                ></textarea>
                            </div>

                            {feedbackMessage && (
                                <p className={`text-xs mb-3 ${feedbackMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                                    {feedbackMessage}
                                </p>
                            )}

                            <button 
                                onClick={handleSubmitFeedback}
                                disabled={feedbackSubmitting}
                                className="btn-primary w-full disabled:opacity-60"
                            >
                                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'FEEDBACK') {
            return (
                <div className="max-w-3xl mx-auto animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-black">My Feedback History</h2>
                        <button 
                            onClick={() => setFeedbackFormVisible(!feedbackFormVisible)}
                            className="btn-primary text-xs py-2 px-4"
                        >
                            {feedbackFormVisible ? 'Cancel' : 'Give Feedback'}
                        </button>
                    </div>

                    {feedbackFormVisible && (
                        <div className="card mb-6">
                            <h3 className="font-bold text-white mb-4">Submit New Feedback</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Course</label>
                                    <select 
                                        value={newFeedback.course}
                                        onChange={(e) => setNewFeedback({...newFeedback, course: e.target.value})}
                                        className="w-full bg-gray-900 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-white"
                                    >
                                        <option value="">Choose a course...</option>
                                        {myCourses.map(c => (
                                            <option key={c._id} value={c.code}>{c.code} - {c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setNewFeedback({...newFeedback, rating: v})}
                                                className={`flex-1 aspect-square rounded-lg font-bold text-sm transition-all ${newFeedback.rating >= v ? 'bg-white text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comment</label>
                                    <textarea
                                        value={newFeedback.comment}
                                        onChange={(e) => setNewFeedback({...newFeedback, comment: e.target.value})}
                                        className="w-full bg-gray-900 text-white rounded-xl px-3 py-2.5 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Share your thoughts..."
                                    ></textarea>
                                </div>
                                <button 
                                    onClick={handleAddFeedback}
                                    className="btn-primary w-full"
                                >
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {feedbackHistory.map(item => (
                            <div key={item.id} className="card flex gap-4">
                                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-400">{item.course.substring(0, 2)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white">{item.title}</h4>
                                        <span className="text-xs text-gray-500">{item.date}</span>
                                    </div>
                                    <div className="flex gap-1 text-yellow-400 text-xs my-1">
                                        {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                                    </div>
                                    <p className="text-gray-400 text-sm">"{item.comment}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'RESOURCES') {
            return (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <h2 className="text-3xl font-bold text-black mb-2">Student Resources</h2>
                    <p className="text-gray-600 mb-8">Curated materials to help you succeed.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resources.map(res => (
                            <div key={res.id} className="card hover:bg-gray-900 group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs ${res.type === 'PDF' ? 'bg-red-500' :
                                            res.type === 'Video' ? 'bg-blue-500' :
                                                res.type === 'Tool' ? 'bg-purple-500' : 'bg-green-500'
                                        }`}>
                                        {res.type}
                                    </div>
                                    <span className="text-xs text-gray-500">{res.date}</span>
                                </div>
                                <h3 className="font-bold text-white mb-1">{res.title}</h3>
                                <p className="text-xs text-gray-400 mb-4">{res.size} • Available Offline</p>
                                <button 
                                    onClick={() => handleDownloadResource(res)}
                                    className="text-sm font-bold text-white group-hover:underline flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Download Material
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'PROFILE') {
            return (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="text-center mb-12">
                        <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-black text-gray-400">
                            {user?.name.charAt(0)}
                        </div>
                        <h2 className="text-4xl font-bold text-black">{user?.name}</h2>
                        <p className="text-gray-600 mt-2">{user?.email}</p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full uppercase">Student</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="card text-center py-6">
                            <div className="text-3xl font-bold text-white">3</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Enrolled Courses</div>
                        </div>
                        <div className="card text-center py-6">
                            <div className="text-3xl font-bold text-white">85%</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Attendance</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-white mb-6 pb-4">Profile Settings</h3>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                                <input 
                                    type="text" 
                                    value={profileForm.name} 
                                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                    className="w-full bg-gray-900 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-white" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bio</label>
                                <textarea 
                                    value={profileForm.bio}
                                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                                    className="w-full bg-gray-900 text-white rounded-xl px-3 py-2.5 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-white" 
                                    placeholder="Tell us about yourself..."
                                ></textarea>
                            </div>
                            {profileMessage && (
                                <p className={`text-xs ${profileMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                                    {profileMessage}
                                </p>
                            )}
                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={profileSaving}
                                    className="btn-primary w-full disabled:opacity-60"
                                >
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-white selection:bg-black selection:text-white">
            <nav className="glass sticky top-0 z-50 bg-black text-white">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <span className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center text-xs">S</span>
                            STUDENT<span className="text-gray-500">OS</span>
                        </h1>
                        <div className="hidden lg:flex gap-1">
                            {['DASHBOARD', 'COURSES', 'FEEDBACK', 'RESOURCES', 'PROFILE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`nav-link text-xs uppercase tracking-wide ${activeTab === tab ? 'active' : ''}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-white">{user?.name}</div>
                                <div className="text-[10px] text-gray-400 font-semibold uppercase">{user?.role}</div>
                            </div>
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-300 text-xs">
                                {user?.name.charAt(0)}
                            </div>
                        </div>
                        <button onClick={logout} className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {renderContent()}
            </main>
        </div>
    );
};

export default StudentDashboard;
