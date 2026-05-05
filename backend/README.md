## Backend - Real-Time Anonymous Course Feedback System

This is the Node/Express backend for the MERN-based **Real-Time Anonymous Course Feedback System**.

### MongoDB Connection (Compass)

- Default connection string (local):

`mongodb://localhost:27017/`

- The backend expects a database named `course_feedback` by default.

You can connect via **MongoDB Compass** using:

`mongodb://localhost:27017/course_feedback`

### Environment Variables

Create a `.env` file in the `backend/` folder with:

```bash
MONGODB_URI=mongodb://localhost:27017/course_feedback
JWT_SECRET=your_strong_jwt_secret_here
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

### Scripts

- `npm install`
- `npm run dev` – start development server with Nodemon.

