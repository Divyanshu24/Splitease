import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/groups" className="text-xl font-bold tracking-tight hover:text-indigo-200">
          💸 SplitEase
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-indigo-200">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-md transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
