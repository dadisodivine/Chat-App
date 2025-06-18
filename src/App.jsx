import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import LoginForm from './Login/Login'
import SignupForm from './SignUp/SignUp'
import ChatComponent from './ChatPage/ChatComponent'
import { useContext } from 'react'
import { AuthContext } from './Context/AuthContext'

function App() {
  const {Currentuser} = useContext(AuthContext)
  console.log(Currentuser)

  const ProtectedRoute = ({ children }) => {
    if (!Currentuser) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="signup" element={<SignupForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path='chat' element={<ProtectedRoute><ChatComponent/></ProtectedRoute>} />
        
      </Routes>
    </Router>
  )
}

export default App
