import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaClock,
  FaFilter,
  FaSearch,
  FaRupeeSign,
  FaUserCheck
} from 'react-icons/fa';

const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getVerificationRequests({ status: filter });
      setRequests(data);
    } catch (error) {
      toast.error('Failed to fetch verification requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleStatusUpdate = async (requestId, status) => {
    const action = status === 'approved' ? 'Approve' : 'Reject';
    
    if (status === 'rejected' && !remarks.trim()) {
      toast.error('Please provide remarks for rejection');
      return;
    }

    if (window.confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) {
      try {
        await productAPI.updateVerificationStatus(requestId, { 
          status, 
          remarks: status === 'rejected' ? remarks : '' 
        });
        toast.success(`Request ${status} successfully`);
        fetchRequests();
        setShowModal(false);
        setRemarks('');
      } catch (error) {
        toast.error(`Failed to ${action.toLowerCase()} request`);
      }
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.name.toLowerCase().includes(searchLower) ||
      request.mobile.includes(searchTerm) ||
      request.transactionId.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="text-green-500 mr-2" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500 mr-2" />;
      default:
        return <FaClock className="text-yellow-500 mr-2" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const { color, label } = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} flex items-center`}>
        {getStatusIcon(status)}
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
            <p className="text-gray-600 mt-2">Manage user account verification and subscription approvals</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <FaRupeeSign className="inline mr-1" /> ₹49 per approval
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg flex items-center transition duration-300 ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('pending')}
            >
              <FaClock className="mr-2" />
              Pending ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg flex items-center transition duration-300 ${
                filter === 'approved' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('approved')}
            >
              <FaCheckCircle className="mr-2" />
              Approved ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg flex items-center transition duration-300 ${
                filter === 'rejected' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('rejected')}
            >
              <FaTimesCircle className="mr-2" />
              Rejected ({requests.filter(r => r.status === 'rejected').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg flex items-center transition duration-300 ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('all')}
            >
              <FaFilter className="mr-2" />
              All Requests
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, mobile, or transaction ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaUserCheck className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{requests.filter(r => r.status === 'approved').length * 40}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaRupeeSign className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading verification requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <FaUserCheck className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try changing your search terms' : 'No verification requests available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition duration-300">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.name}</div>
                        <div className="text-sm text-gray-500">{request.mobile}</div>
                        {request.userId?.subscriptionDate && (
                          <div className="text-xs text-gray-400 mt-1">
                            Subscribed: {formatDate(request.userId.subscriptionDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm">
                          {request.transactionId}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => viewDetails(request)}
                          className="flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          <FaEye className="mr-1" /> View
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request._id, 'approved')}
                              className="flex items-center text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              <FaCheckCircle className="mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowModal(true);
                              }}
                              className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              <FaTimesCircle className="mr-1" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRemarks('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-3">User Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <p className="font-medium">{selectedRequest.mobile}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">User ID:</span>
                      <p className="font-mono text-sm">{selectedRequest.userId?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Transaction ID:</span>
                      <p className="font-mono font-medium break-all">{selectedRequest.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Amount:</span>
                      <p className="font-medium text-green-600">₹40</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
                <div className="flex items-center">
                  {getStatusBadge(selectedRequest.status)}
                  {selectedRequest.reviewedAt && (
                    <span className="ml-4 text-sm text-gray-600">
                      Reviewed: {formatDate(selectedRequest.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Remarks Input for Rejection */}
              {selectedRequest.status === 'pending' && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Remarks (Required for rejection)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                    rows="3"
                    placeholder="Enter remarks for rejection..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Remarks are only required when rejecting a request.
                  </p>
                </div>
              )}

              {/* Existing Remarks */}
              {selectedRequest.remarks && (
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-2">Admin Remarks</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">{selectedRequest.remarks}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRemarks('');
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition duration-300"
                >
                  Close
                </button>
                
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'rejected')}
                      disabled={!remarks.trim()}
                      className={`px-6 py-3 rounded-lg font-medium transition duration-300 flex items-center ${
                        remarks.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-200 text-red-400 cursor-not-allowed'
                      }`}
                    >
                      <FaTimesCircle className="mr-2" />
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                      className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition duration-300 flex items-center"
                    >
                      <FaCheckCircle className="mr-2" />
                      Approve Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;