import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { admin, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-white hover:text-blue-100">
              Phone Pricing Admin
            </Link>
            
            {admin && (
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/" 
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/products" 
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Products
                </Link>
                <Link 
                  to="/verification" 
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Verification Requests
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    New
                  </span>
                </Link>
              </div>
            )}
          </div>
          
          {admin && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-bold text-sm">A</span>
                  </div>
                  <span className="text-white text-sm font-medium">{admin.email}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {admin && (
          <div className="md:hidden border-t border-blue-500 pt-2 pb-3">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                to="/products" 
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Products
              </Link>
              <Link 
                to="/verification" 
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Verification Requests
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  New
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;