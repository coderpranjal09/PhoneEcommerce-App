import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FaBox,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaUserCheck,
  FaRupeeSign,
  FaChartLine
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch products count
      const productsRes = await productAPI.getProducts({ limit: 1 });
      
      // Fetch verification requests
      const requestsRes = await productAPI.getVerificationRequests({ status: 'all' });
      
      // Calculate stats
      const pending = requestsRes.data.filter(req => req.status === 'pending').length;
      const approved = requestsRes.data.filter(req => req.status === 'approved').length;
      const rejected = requestsRes.data.filter(req => req.status === 'rejected').length;
      
      // Get recent requests (last 5)
      const recent = requestsRes.data.slice(0, 5);

      setStats({
        totalProducts: productsRes.data.total || 0,
        pendingVerifications: pending,
        approvedVerifications: approved,
        rejectedVerifications: rejected,
        totalRevenue: approved * 40, // ₹40 per approved user
        activeUsers: approved
      });

      setRecentRequests(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white rounded-xl shadow-md p-6 transition-transform duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="text-white text-2xl" />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
      approved: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle }
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} flex items-center gap-1`}>
        <Icon className="mr-1" /> {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={FaBox}
          color="bg-blue-500"
          description="All active products in your inventory"
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={FaClock}
          color="bg-yellow-500"
          description="Users awaiting account approval"
        />
        <StatCard
          title="Approved Users"
          value={stats.approvedVerifications}
          icon={FaUserCheck}
          color="bg-green-500"
          description="Active verified users"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          icon={FaRupeeSign}
          color="bg-purple-500"
          description="From subscription fees"
        />
        <StatCard
          title="Rejected Requests"
          value={stats.rejectedVerifications}
          icon={FaTimesCircle}
          color="bg-red-500"
          description="Verification requests declined"
        />
        <StatCard
          title="Growth Rate"
          value="+12.5%"
          icon={FaChartLine}
          color="bg-indigo-500"
          description="Compared to last month"
        />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Verification Requests */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Verification Requests</h2>
              <Link
                to="/verification"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No verification requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.mobile}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link
                            to="/verification"
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/add"
                className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-300"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <FaBox className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Add New Product</p>
                    <p className="text-sm text-gray-600">Create new product listing</p>
                  </div>
                </div>
                <span className="text-blue-600">→</span>
              </Link>

              <Link
                to="/products"
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition duration-300"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                    <FaBox className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Products</p>
                    <p className="text-sm text-gray-600">View and edit all products</p>
                  </div>
                </div>
                <span className="text-green-600">→</span>
              </Link>

              <Link
                to="/verification"
                className="flex items-center justify-between p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition duration-300"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                    <FaUserCheck className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Verify Users</p>
                    <p className="text-sm text-gray-600">
                      {stats.pendingVerifications} pending requests
                    </p>
                  </div>
                </div>
                <span className="text-yellow-600">→</span>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Users Online</span>
                <span className="font-medium text-gray-900">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;