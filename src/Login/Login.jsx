import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../FirebaseConfig/firebase';
import { useState } from 'react';
import logo from '../assets/react.svg'; // Replace with your actual logo file if available

function Toast({ message, type, show }) {
  return (
    <div className={`toast${show ? ' show' : ''}${type ? ' ' + type : ''}`}>
      {message}
    </div>
  );
}

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      showToast('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Login successful!', 'success');
      setTimeout(() => navigate('/chat'), 1200);
    } catch (error) {
      const errorMessages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/invalid-credential': 'Invalid email or password'
      };
      const errorMessage = errorMessages[error.code] || 'An error occurred during login';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // You can implement forgot password functionality here
    showToast('Forgot password feature coming soon!', 'error');
  };

  return (
    <div className="login-split-container responsive-login-container">
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      
      <div className="login-left">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2>Login</h2>
          <p>Please login to access the system</p>
          
          {error && (
            <div className="login-error-message" role="alert">
              {error}
            </div>
          )}
          
          <input
            type="email"
            placeholder="Enter your e-mail"
            value={email}
            onChange={handleInputChange(setEmail)}
            required
            name="email"
            autoComplete="email"
            disabled={loading}
            aria-label="Email address"
          />
          
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={handleInputChange(setPassword)}
            required
            name="password"
            autoComplete="current-password"
            disabled={loading}
            aria-label="Password"
          />
          
          <div className="login-remember">
            <input 
              type="checkbox" 
              id="remember" 
              disabled={loading}
              aria-describedby="remember-help"
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          
          <button type="submit" disabled={loading} aria-label={loading ? 'Signing in...' : 'Sign in'}>
            {loading && <span className="login-spinner" aria-hidden="true"></span>}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <a 
            href="#" 
            className="login-link" 
            onClick={handleForgotPassword}
            aria-label="Forgot password"
          >
            Forgot your password?
          </a>
          
          <div className="login-created">
            Created by<br/>Kelvin Queiroz
          </div>
          
          <div className="login-signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
      
      <div className="login-right">
        <div className="chatter-logo-topright">
          <img src={logo} alt="Chatter Logo" className="chatter-logo" />
          <span className="chatter-title">Chatter</span>
        </div>
        <div className="login-right-message">
          Welcome back
        </div>
      </div>
    </div>
  );
};

export default LoginForm;