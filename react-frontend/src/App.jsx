import { useEffect, useState } from "react";
import { useUser } from "./context/UserContext";
import "./App.css";

export default function App() {
  const { user, login, register, logout, request } = useUser();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [courses, setCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [price, setPrice] = useState("0");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadCourses() {
    try {
      const data = await request("/api/course");
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (user) loadCourses();
  }, [user]);

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "register") {
        await register(username, email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }

      setPassword("");
      setMessage("Success!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function resetCourseForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setInstructor("");
    setPrice("0");
  }

  async function handleCourseSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const body = { title, description, instructor, price: Number(price) };

      if (editingId) {
        await request(`/api/course/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMessage("Course updated!");
      } else {
        await request("/api/course", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setMessage("Course added!");
      }

      resetCourseForm();
      await loadCourses();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(course) {
    setEditingId(course._id);
    setTitle(course.title || "");
    setDescription(course.description || "");
    setInstructor(course.instructor || "");
    setPrice(String(course.price ?? 0));
  }

  async function deleteCourse(id) {
    if (!window.confirm("Delete this course?")) return;

    try {
      await request(`/api/course/${id}`, { method: "DELETE" });
      setMessage("Course deleted!");
      await loadCourses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <section className="panel auth-panel">
          <h1>Course Management</h1>
          <p>Sign in or create an account to continue.</p>

          <div className="switcher">
            <button type="button" onClick={() => setMode("login")}>
              Login
            </button>
            <button type="button" onClick={() => setMode("register")}>
              Register
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {mode === "register" && (
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            <button disabled={busy} type="submit">
              {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Course Management</h1>
          <p>Welcome, {user.username || user.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            setMessage("");
          }}
        >
          Logout
        </button>
      </header>

      <section className="panel">
        <h2>{editingId ? "Edit Course" : "Add a Course"}</h2>

        <form onSubmit={handleCourseSubmit}>
          <label>
            Course title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label>
            Instructor
            <input
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
            />
          </label>

          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>

          <div className="actions">
            <button disabled={busy} type="submit">
              {editingId ? "Save changes" : "Add course"}
            </button>
            {editingId && (
              <button type="button" onClick={resetCourseForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="panel">
        <div className="list-heading">
          <h2>Courses</h2>
          <button onClick={loadCourses}>Refresh</button>
        </div>

        {courses.length === 0 ? (
          <p>No courses found. Add your first course above.</p>
        ) : (
          <div className="course-list">
            {courses.map((course) => (
              <article className="course" key={course._id}>
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <p>Instructor: {course.instructor || "Not specified"}</p>
                  <strong>Price: {course.price}</strong>
                </div>
                <div className="actions">
                  <button onClick={() => startEdit(course)}>Edit</button>
                  <button onClick={() => deleteCourse(course._id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}