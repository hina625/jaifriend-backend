const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');

// Import cloud storage configuration
const { upload } = require('../config/cloudinary');

// Import event controller
const eventController = require('../controllers/eventController');

// Event CRUD operations
router.post('/', auth, upload.single('coverImage'), eventController.createEvent);
router.get('/', auth, eventController.getEvents);

// Specific routes (must come before parameterized routes)
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/search', eventController.searchEvents);
router.get('/categories', eventController.getEventCategories);
router.get('/categories/:category', eventController.getEventsByCategory);
router.get('/recommendations', auth, eventController.getRecommendedEvents);
router.get('/nearby', eventController.getNearbyEvents);

// Parameterized routes
router.get('/:eventId', auth, eventController.getEventById);
router.put('/:eventId', auth, upload.single('coverImage'), eventController.updateEvent);
router.delete('/:eventId', auth, eventController.deleteEvent);

// Event attendance
router.post('/:eventId/attend', auth, eventController.attendEvent);
router.post('/:eventId/maybe', auth, eventController.maybeAttendEvent);
router.post('/:eventId/decline', auth, eventController.declineEvent);
router.delete('/:eventId/attend', auth, eventController.removeAttendance);

// Event invitations
router.post('/:eventId/invite', auth, eventController.inviteUser);
router.post('/:eventId/invite-multiple', auth, eventController.inviteMultipleUsers);
router.get('/:eventId/invitations', auth, eventController.getEventInvitations);
router.post('/:eventId/invitations/:invitationId/accept', auth, eventController.acceptInvitation);
router.post('/:eventId/invitations/:invitationId/decline', auth, eventController.declineInvitation);

// Event tickets
router.post('/:eventId/tickets', auth, eventController.addTicket);
router.get('/:eventId/tickets', eventController.getEventTickets);
router.put('/:eventId/tickets/:ticketId', auth, eventController.updateTicket);
router.delete('/:eventId/tickets/:ticketId', auth, eventController.deleteTicket);
router.post('/:eventId/tickets/:ticketId/purchase', auth, eventController.purchaseTicket);

// Event content
router.get('/:eventId/posts', auth, eventController.getEventPosts);
router.post('/:eventId/posts', auth, eventController.createEventPost);
router.get('/:eventId/photos', auth, eventController.getEventPhotos);
router.post('/:eventId/photos', auth, upload.array('photos', 10), eventController.uploadEventPhotos);

// Event attendees
router.get('/:eventId/attendees', eventController.getEventAttendees);
router.get('/:eventId/attendees/going', eventController.getGoingAttendees);
router.get('/:eventId/attendees/maybe', eventController.getMaybeAttendees);
router.get('/:eventId/attendees/not-going', eventController.getNotGoingAttendees);

// Event management
router.post('/:eventId/cancel', auth, eventController.cancelEvent);
router.post('/:eventId/feature', auth, eventController.featureEvent);
router.post('/:eventId/unfeature', auth, eventController.unfeatureEvent);
router.get('/:eventId/stats', auth, eventController.getEventStats);

module.exports = router; 