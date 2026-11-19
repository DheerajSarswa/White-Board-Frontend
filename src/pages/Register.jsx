import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import styles from "./Register.module.css";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const { register, login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      // Login validation
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      setIsLoading(true);
      try {
        await login(email, password);
        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Registration validation
      if (!name.trim()) {
        setError("Name is required");
        return;
      }

      if (!email.trim()) {
        setError("Email is required");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);
      try {
        await register(name, email, password);
        navigate("/dashboard");
      } catch (err) {
        setError(
          err.message || err.errors?.email?.[0] || "Registration failed",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={styles.container}>
      <aside className={styles.story}>
        <div className={styles.brand}><span>✳</span> whiteboard</div>
        <div><h2>A little space.<br />A lot of <em>possibility.</em></h2>
        <p>Sketch the first idea. Connect the dots. Make something great, together.</p></div>
        <div className={styles.storyFooter}>Your ideas deserve a place to grow.</div>
      </aside>
      <div className={styles.formWrapper}>
        <div className={styles.eyebrow}>Your creative workspace</div>
        <h1 className={styles.title}>{isLogin ? "Welcome back." : "Make room for ideas."}</h1>

        <p className={styles.subtitle}>{isLogin ? "Sign in to pick up where you left off." : "Create an account and bring your next idea to life."}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input
                id="name" autoComplete="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email" autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password" autoComplete={isLogin ? "current-password" : "new-password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword" autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>
          )}

          {error && <div role="alert" className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading
              ? isLogin
                ? "Logging in..."
                : "Creating Account..."
              : isLogin
                ? "Login"
                : "Register"}
          </button>
        </form>

        <div className={styles.toggleMode}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
