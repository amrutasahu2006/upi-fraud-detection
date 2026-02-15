const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circleController');
const { protect } = require('../middleware/auth'); // Use your existing auth middleware

// All circle routes should be protected
router.use(protect);

// Route to sync Google contacts
router.post('/sync', circleController.syncGoogleContacts);

// Route to report a fraudulent payee to the circle
router.post('/report', circleController.reportToCircle);

// (Optional) Route to get current circle members
router.get('/members', async (req, res) => {
    const user = await User.findById(req.user.id).populate('trustedCircle', 'username profile phoneNumber');
    res.json(user.trustedCircle);
});

module.exports = router;