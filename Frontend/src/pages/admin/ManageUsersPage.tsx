import { useState, useEffect } from 'react';
import api from '../../api/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'donor' | 'fundraiser';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'donor' | 'fundraiser'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (filter !== 'all') params.role = filter;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get('/users', { params });
        setUsers(response.data.users || []);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setError(err.response?.data?.message || 'Failed to load users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [filter, searchTerm]);

  const handleToggleStatus = async (user: User) => {
    try {
      setToggling(true);
      await api.post(`/users/${user._id}/toggle-status`);

      // Update local state
      setUsers(users.map(u => 
        u._id === user._id 
          ? { ...u, isActive: !u.isActive }
          : u
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle user status');
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);
      await api.delete(`/users/${selectedUser._id}`);

      // Remove deleted user from list
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'fundraiser':
        return 'bg-blue-100 text-blue-700';
      case 'donor':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Manage Users</h1>
      <p className="text-slate-500 mb-8">View and manage platform users</p>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter and search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'admin', 'donor', 'fundraiser'] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === role
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)} ({users.filter(u => role === 'all' || u.role === role).length})
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block">
            <div className="animate-spin">
              <i className="fa-solid fa-spinner text-4xl text-emerald-600" />
            </div>
          </div>
          <p className="mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-medium capitalize ${getRoleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                          <i className="fa-solid fa-check-circle" /> Yes
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(u.isActive)}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={toggling}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <i className="fa-solid fa-inbox text-4xl mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete User</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
