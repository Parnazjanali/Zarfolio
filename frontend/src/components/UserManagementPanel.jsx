import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Button, message, Spin, Alert, Typography } from 'antd';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient'; // Assuming an apiClient exists

const { Option } = Select;
const { Title } = Typography;

// Define roles - these should ideally match backend definitions
const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'seller', label: 'Seller' },
];

const fetchUsers = async (authToken) => {
  const { data } = await apiClient.get('/users', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return data;
};

const updateUserRole = async ({ userId, role, authToken }) => {
  const { data } = await apiClient.put(
    `/users/${userId}/role`,
    { role },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return data;
};

const UserManagementPanel = () => {
  const { authToken } = useAuth();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState(''); // To manage which row's role is being edited

  const { data: users, isLoading, error, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(authToken),
    enabled: !!authToken, // Only run query if authToken is available
  });

  const mutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: (data, variables) => {
      message.success(`Role for user ${variables.userId} updated to ${variables.role}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingKey(''); // Clear editing state after successful update
    },
    onError: (err, variables) => {
      console.error('Error updating user role:', err);
      const errorMsg = err.response?.data?.message || `Failed to update role for user ${variables.userId}.`;
      message.error(errorMsg);
      // Optionally, refetch users to revert optimistic updates or ensure consistency if the error was temporary
      // queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleRoleChange = (userId, newRole) => {
    if (!authToken) {
      message.error('Authentication token not found. Please log in again.');
      return;
    }
    mutation.mutate({ userId, role: newRole, authToken });
  };
  
  const isEditing = (record) => record.id === editingKey;

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
      width: '25%',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: '25%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '25%',
      render: (role, record) => {
        if (isEditing(record)) {
          return (
            <Select
              defaultValue={role}
              style={{ width: 150 }}
              onChange={(newRole) => handleRoleChange(record.id, newRole)}
              onBlur={() => { 
                // Optional: if you want to save on blur or have a separate save button
                // For now, onChange directly triggers mutation. If there was a save button,
                // it would call handleRoleChange. Blur could cancel editing if not saved.
                // If not saving on blur, you might want to setEditingKey('') here if no change was made
                // or if you have a separate save button.
              }}
              loading={mutation.isLoading && editingKey === record.id}
              disabled={mutation.isLoading && editingKey === record.id}
            >
              {ROLES.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>
          );
        }
        return ROLES.find(r => r.value === role)?.label || role;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <span>
              {/* Save action is handled by Select's onChange for simplicity */}
              {/* <Button onClick={() => save(record.id)} style={{ marginRight: 8 }} loading={mutation.isLoading}>Save</Button> */}
              <Button onClick={() => setEditingKey('')} disabled={mutation.isLoading && editingKey === record.id}>Cancel</Button>
            </span>
          );
        }
        return (
          <Button onClick={() => setEditingKey(record.id)} disabled={editingKey !== '' || mutation.isLoading}>
            Change Role
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return <Spin tip="Loading users..." size="large" style={{ display: 'block', marginTop: '20px' }} />;
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error.response?.data?.message || error.message || 'Failed to load users.'}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>User Management</Title>
      {isFetching && !isLoading && <Spin tip="Refreshing user data..." style={{ marginBottom: '10px' }}/>}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        bordered
        loading={mutation.isLoading} // General loading state for table during mutation
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default UserManagementPanel;
