// ===============================================================
//  alertController.js
//  Handles fetching and dismissing system alerts and spending
//  warnings for the authenticated user.
// ===============================================================

const Alert = require('../models/Alert');

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Get all unread alerts for the logged-in user
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id, isRead: false })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching alerts', error: error.message });
  }
};

// @desc    Mark an alert as read (dismiss)
// @route   PUT /api/alerts/:id/read
// @access  Private
const markAlertAsRead = async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.isRead = true;
    await alert.save();

    res.status(200).json({ success: true, data: alert, message: 'Alert dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating alert', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  getAlerts,
  markAlertAsRead,
};
