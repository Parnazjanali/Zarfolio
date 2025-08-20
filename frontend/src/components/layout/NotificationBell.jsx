import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';

const notificationTypes = {
  URGENT: { color: 'red', icon: <CircleIcon sx={{ color: 'red' }} /> },
  WARNING: { color: 'orange', icon: <CircleIcon sx={{ color: 'orange' }} /> },
  INFO: { color: 'blue', icon: <CircleIcon sx={{ color: 'blue' }} /> },
  SUCCESS: { color: 'green', icon: <CircleIcon sx={{ color: 'green' }} /> },
};

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    // In a real application, you would fetch notifications from the API
    const dummyNotifications = [
      { id: 1, message: 'This is a test notification', type: 'INFO', is_read: false },
      { id: 2, message: 'This is another test notification', type: 'URGENT', is_read: false },
      { id: 3, message: 'This is a success message', type: 'SUCCESS', is_read: true },
      { id: 4, message: 'This is a warning', type: 'WARNING', is_read: false },
      { id: 5, message: 'This is a new info message', type: 'INFO', is_read: false },
      { id: 6, message: 'This is an old info message', type: 'INFO', is_read: true },
    ];
    setNotifications(dummyNotifications);
    setUnreadCount(dummyNotifications.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id) => {
    // In a real application, you would call the API to mark the notification as read
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(unreadCount - 1);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {notifications.slice(0, 5).map((notification) => (
          <MenuItem key={notification.id} onClick={handleClose}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: 300 }}>
                {notificationTypes[notification.type].icon}
              <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                {notification.message}
              </Typography>
              {!notification.is_read && (
                <Button size="small" onClick={() => handleMarkAsRead(notification.id)}>
                  Mark as read
                </Button>
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NotificationBell;