import React, { useState } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const notificationTypes = [
  { value: 'URGENT', label: 'Urgent', color: 'red' },
  { value: 'WARNING', label: 'Warning', color: 'orange' },
  { value: 'INFO', label: 'Info', color: 'blue' },
  { value: 'SUCCESS', label: 'Success', color: 'green' },
];

const users = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
];

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'message', headerName: 'Message', width: 300 },
  { field: 'type', headerName: 'Type', width: 150 },
  { field: 'recipient', headerName: 'Recipient', width: 150 },
  { field: 'scheduledAt', headerName: 'Scheduled At', width: 200 },
  { field: 'status', headerName: 'Status', width: 150 },
];

const rows = [
    { id: 1, message: 'This is a test notification', type: 'INFO', recipient: 'ALL', scheduledAt: null, status: 'SENT' },
    { id: 2, message: 'This is another test notification', type: 'URGENT', recipient: 'User 1', scheduledAt: null, status: 'SENT' },
];

const AdminNotificationPage = () => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [recipientType, setRecipientType] = useState('ALL');
  const [recipientUser, setRecipientUser] = useState(null);
  const [scheduledAt, setScheduledAt] = useState(null);

  const handleSendNotification = () => {
    // Logic to send notification
    console.log({
      message,
      type,
      recipientType,
      recipientUser,
      scheduledAt,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Notifications
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create Notification
        </Typography>
        <TextField
          label="Message"
          multiline
          rows={4}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {notificationTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: option.color, mr: 1 }} />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            row
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
          >
            <FormControlLabel value="ALL" control={<Radio />} label="All Users" />
            <FormControlLabel value="USER" control={<Radio />} label="Specific User" />
          </RadioGroup>
        </FormControl>
        {recipientType === 'USER' && (
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.name}
            onChange={(event, newValue) => {
              setRecipientUser(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Select User" sx={{ mb: 2 }} />}
          />
        )}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
                renderInput={(props) => <TextField {...props} fullWidth sx={{ mb: 2 }} />}
                label="Schedule At"
                value={scheduledAt}
                onChange={(newValue) => {
                    setScheduledAt(newValue);
                }}
            />
        </LocalizationProvider>
        <Button variant="contained" onClick={handleSendNotification}>
          Send Notification
        </Button>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sent Notifications
        </Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            checkboxSelection
            disableSelectionOnClick
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminNotificationPage;