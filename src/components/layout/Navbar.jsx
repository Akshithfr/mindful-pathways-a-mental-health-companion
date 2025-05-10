// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">Mindful Pathways</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="nav-link">Home</Link>
            
            {currentUser ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/mood-tracking" className="nav-link">Mood Tracking</Link>
                <Link to="/chat-support" className="nav-link">Chat Support</Link>
                <Link to="/resources" className="nav-link">Resources</Link>
                <div className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 rounded">
                  {currentUser.name}
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link 
                  to="/register" 
                  className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button - You can expand this for a mobile menu */}
          <div className="md:hidden flex items-center">
            <button className="mobile-menu-button">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - Hidden by default */}
      <div className="mobile-menu hidden md:hidden">
        <Link to="/" className="block py-2 px-4 text-sm hover:bg-gray-200">Home</Link>
        
        {currentUser ? (
          <>
            <Link to="/dashboard" className="block py-2 px-4 text-sm hover:bg-gray-200">Dashboard</Link>
            <Link to="/mood-tracking" className="block py-2 px-4 text-sm hover:bg-gray-200">Mood Tracking</Link>
            <Link to="/chat-support" className="block py-2 px-4 text-sm hover:bg-gray-200">Chat Support</Link>
            <Link to="/resources" className="block py-2 px-4 text-sm hover:bg-gray-200">Resources</Link>
            <button 
              onClick={handleLogout}
              className="block w-full text-left py-2 px-4 text-sm hover:bg-gray-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="block py-2 px-4 text-sm hover:bg-gray-200">Login</Link>
            <Link to="/register" className="block py-2 px-4 text-sm hover:bg-gray-200">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;