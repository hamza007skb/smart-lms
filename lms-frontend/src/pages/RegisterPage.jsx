import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    value: "student",
    label: "Student",
    desc: "Access courses, submit assignments, track progress.",
    icon: "🎓",
  },
];

const inputStyle = {
  background: "var(--cream)",
  border: "1.5px solid var(--warm-gray)",
  color: "var(--plum-950)",
  fontFamily: "DM Sans, sans-serif",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const selectRole = (role) => setForm((prev) => ({ ...prev, role }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      setError("Please select a role.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userData = await register(
        form.email,
        form.password,
        form.role,
        form.name,
      );

      if (userData?.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off-white)] p-6 page-enter">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <span
            className="font-serif text-3xl"
            style={{ color: "var(--plum-900)" }}
          >
            Academica
          </span>
          <span className="ml-2 text-[var(--plum-500)] text-sm tracking-widest uppercase">
            LMS
          </span>
        </div>

        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ background: "white", border: "1px solid var(--warm-gray)" }}
        >
          <h1
            className="font-serif text-3xl mb-1"
            style={{ color: "var(--plum-950)" }}
          >
            Create your account
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--plum-500)" }}>
            Join Academica and start learning or teaching today.
          </p>

          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selection */}
            <div>
              <label
                className="block text-xs font-medium tracking-wider uppercase mb-3"
                style={{ color: "var(--plum-700)" }}
              >
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => selectRole(r.value)}
                    className="text-left p-4 rounded-xl transition-all"
                    style={{
                      border:
                        form.role === r.value
                          ? "2px solid var(--plum-600)"
                          : "1.5px solid var(--warm-gray)",
                      background:
                        form.role === r.value
                          ? "var(--plum-50)"
                          : "var(--cream)",
                    }}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div
                      className="font-medium text-sm mb-0.5"
                      style={{ color: "var(--plum-900)" }}
                    >
                      {r.label}
                    </div>
                    <div
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--plum-500)" }}
                    >
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium tracking-wider uppercase mb-2"
                style={{ color: "var(--plum-700)" }}
              >
                Full name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--plum-500)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--warm-gray)")
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium tracking-wider uppercase mb-2"
                style={{ color: "var(--plum-700)" }}
              >
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--plum-500)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--warm-gray)")
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium tracking-wider uppercase mb-2"
                style={{ color: "var(--plum-700)" }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--plum-500)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--warm-gray)")
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm tracking-wide transition-all disabled:opacity-60"
              style={{ background: "var(--plum-800)", color: "white" }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = "var(--plum-700)";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = "var(--plum-800)";
              }}
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>
        </div>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--plum-500)" }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium underline underline-offset-2"
            style={{ color: "var(--plum-700)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
