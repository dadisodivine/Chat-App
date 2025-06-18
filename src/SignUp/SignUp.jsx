// SignupForm.js
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig/firebase';
import './SignUp.css';
import { Link,useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';

const SignupForm = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    setError(''); // Clear any previous errors
    // Basic validation
    if (!email || !username || !password) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    try {
      // Create user with email and password (Firebase creates user immediately)
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: username });
      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid,
        displayName: username,
        email: email,
      });
      await setDoc(doc(db, 'userChats', res.user.uid), {

      });
      // Redirect to chat page after successful signup
      alert('User registered successfully!');
      navigate("/chat")
  
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Error registering user:', errorCode, errorMessage);
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/network-request-failed': 'Network error. Please check your connection'
      };
      
      setError(errorMessages[error.code] || 'An error occurred during registration');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  return (
    <div className="signup-container">
      <div className="signup-form">
        <div className="profile-circle">
          <div className="profile-icon">👤</div>
        </div>
        
        <h2 className="signup-title">SIGN UP</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div className="form-content">
         <form action={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              name="email"
              onKeyPress={handleKeyPress}
              placeholder="Email"
              className="signup-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="text"
              name="username"
              onKeyPress={handleKeyPress}
              placeholder="Username"
              className="signup-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="password"
              onKeyPress={handleKeyPress}
              placeholder="Password"
              className="signup-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              onKeyPress={handleKeyPress}
              placeholder="Confirm Password"
              className="signup-input"
              required
            />
          </div>
          
          <button onClick={handleSubmit} className="signup-button">
            SIGN UP
          </button>
          </form>
        </div>
        
        <div className="login-section">
          <span className="login-text">
            Already have an account?
            <Link to=".." className="login-link">Login</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;