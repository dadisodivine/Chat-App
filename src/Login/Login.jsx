import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../FirebaseConfig/firebase';
import { useState } from 'react';

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    const email = formData.get("email");
    const password = formData.get("password");
    setError(''); // Clear any previous errors

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/chat');
    } catch (error) {
      const errorMessages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection'
      };
      
      setError(errorMessages[error.code] || 'An error occurred during login');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="profile-circle">
          <div className="profile-icon">👤</div>
        </div>
        
        <h2 className="login-title">LOGIN</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form action={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              name='email'
              placeholder="Email"
              className="login-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name='password'
              placeholder="Password"
              className="login-input"
              required
            />
          </div>
          
          <div className="forgot-password">
            
          </div>
          
          <button type="submit" className="login-button">
            LOGIN
          </button>
        </form>
        
        <div className="register-section">
          <Link to="/signup"><span className="register-text">REGISTER</span></Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;