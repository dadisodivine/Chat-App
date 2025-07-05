// SignupForm.js
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig/firebase';
import './SignUp.css';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

function Toast({ message, type, show }) {
  return (
    <div className={`toast${show ? ' show' : ''}${type ? ' ' + type : ''}`}>
      {message}
    </div>
  );
}

function PasswordStrengthIndicator({ password }) {
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score < 2) return { strength: 1, label: 'Weak', class: 'strength-weak' };
    if (score < 4) return { strength: 2, label: 'Medium', class: 'strength-medium' };
    return { strength: 3, label: 'Strong', class: 'strength-strong' };
  };

  const { strength, label, class: strengthClass } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className={`password-strength-bar ${strengthClass}`}></div>
    </div>
  );
}

const SignupForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [passwordMatch, setPasswordMatch] = useState(true);

  // Check password match in real-time
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const validateForm = () => {
    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showToast(validationError, 'error');
      return;
    }
    
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: username });
      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid,
        displayName: username,
        email: email,
        createdAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'userChats', res.user.uid), {});
      showToast('Account created successfully!', 'success');
      setTimeout(() => navigate('/chat'), 1200);
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/network-request-failed': 'Network error. Please check your connection'
      };
      const errorMessage = errorMessages[error.code] || 'An error occurred during registration';
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

  return (
    <div className="signup-split-container">
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      
      <div className="signup-left">
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <h2>Sign Up</h2>
          <p>Create your account to get started</p>
          
          {error && (
            <div className="signup-error-message" role="alert">
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={handleInputChange(setUsername)}
            required
            name="username"
            autoComplete="username"
            disabled={loading}
            aria-label="Username"
            minLength="3"
          />
          
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
            autoComplete="new-password"
            disabled={loading}
            aria-label="Password"
            minLength="6"
          />
          
          <PasswordStrengthIndicator password={password} />
          
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={handleInputChange(setConfirmPassword)}
            required
            name="confirmPassword"
            autoComplete="new-password"
            disabled={loading}
            aria-label="Confirm password"
            style={{
              borderColor: confirmPassword && !passwordMatch ? '#ef4444' : undefined
            }}
          />
          
          {confirmPassword && !passwordMatch && (
            <div style={{ 
              color: '#ef4444', 
              fontSize: '12px', 
              marginTop: '-15px', 
              marginBottom: '15px' 
            }}>
              Passwords do not match
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || (confirmPassword && !passwordMatch)}
            aria-label={loading ? 'Creating account...' : 'Create account'}
          >
            {loading && <span className="signup-spinner" aria-hidden="true"></span>}
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          
          <div className="signup-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
          
          <div className="signup-created">
            Welcome to the chat community!
          </div>
        </form>
      </div>
      
      <div className="signup-right">
        <div className="signup-right-message">
          Join us and start chatting with friends<br />
          across the world. Your journey begins here!
        </div>
      </div>
    </div>
  );
};

export default SignupForm;