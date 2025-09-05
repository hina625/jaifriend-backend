const Event = require('../models/event');
const User = require('../models/user');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// Create event
exports.createEvent = async (req, res) => {
  try {
    console.log('=== Event Creation Started ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID from auth:', req.userId);
    
    // Check if user is authenticated
    if (!req.userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    if (!req.body.title || !req.body.title.trim()) {
      console.log('❌ Title is missing or empty');
      return res.status(400).json({ error: 'Event title is required.' });
    }
    
    if (!req.body.startDate) {
      console.log('❌ Start date is missing');
      return res.status(400).json({ error: 'Start date is required.' });
    }
    
    if (!req.body.endDate) {
      console.log('❌ End date is missing');
      return res.status(400).json({ error: 'End date is required.' });
    }
    
    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const now = new Date();
    
    if (isNaN(startDate.getTime())) {
      console.log('❌ Invalid start date:', req.body.startDate);
      return res.status(400).json({ error: 'Invalid start date format.' });
    }
    
    if (isNaN(endDate.getTime())) {
      console.log('❌ Invalid end date:', req.body.endDate);
      return res.status(400).json({ error: 'Invalid end date format.' });
    }
    
    if (startDate < now) {
      console.log('❌ Start date is in the past');
      return res.status(400).json({ error: 'Start date must be in the future.' });
    }
    
    if (endDate <= startDate) {
      console.log('❌ End date must be after start date');
      return res.status(400).json({ error: 'End date must be after start date.' });
    }
    
    console.log('🔍 Looking for user with ID:', req.userId);
    const user = await User.findById(req.userId);
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('❌ User not found for ID:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle cover image
    let coverImage = null;
    if (req.file) {
      console.log('📸 Image uploaded successfully:', req.file.path);
      if (isCloudinaryConfigured) {
        coverImage = req.file.path; // Cloudinary secure URL
      } else {
        // For local storage, construct a relative URL
        coverImage = `/uploads/${req.file.filename}`;
        console.log('📁 Local image URL:', coverImage);
      }
    } else {
      console.log('📸 No image uploaded');
    }

    // Handle location data properly
    console.log('🔍 Location debugging:');
    console.log('req.body.location:', req.body.location);
    console.log('req.body["location[address]"]:', req.body['location[address]']);
    console.log('req.body keys:', Object.keys(req.body));
    
    let location = null;
    if (req.body['location[address]'] || req.body.location) {
      // Handle location data safely
      let locationAddress = '';
      
      if (req.body['location[address]']) {
        // Handle location[address] field
        if (typeof req.body['location[address]'] === 'string') {
          locationAddress = req.body['location[address]'];
        } else if (req.body['location[address]'] && typeof req.body['location[address]'] === 'object') {
          // If it's an object, try to extract address property
          locationAddress = req.body['location[address]'].address || '';
        } else {
          locationAddress = String(req.body['location[address]'] || '');
        }
      } else if (req.body.location) {
        // Handle location field
        if (typeof req.body.location === 'string') {
          locationAddress = req.body.location;
        } else if (req.body.location && typeof req.body.location === 'object') {
          // If it's an object, try to extract address property
          locationAddress = req.body.location.address || '';
        } else {
          locationAddress = String(req.body.location || '');
        }
      }
      
      location = {
        address: locationAddress
      };
      console.log('📍 Final location object:', location);
    }

    // Handle tags data
    let tags = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        tags = [];
      }
    }

    const eventData = {
      title: req.body.title.trim(),
      description: req.body.description || '',
      organizer: req.userId,
      group: req.body.groupId || null,
      coverImage: coverImage,
      startDate: startDate,
      endDate: endDate,
      location: location,
      category: req.body.category || 'social',
      tags: tags,
      privacy: req.body.privacy || 'public'
    };

    console.log('📋 Event data to save:', eventData);

    console.log('🏗️ Creating new Event instance...');
    const event = new Event(eventData);
    console.log('💾 Saving event to database...');
    await event.save();
    console.log('✅ Event saved successfully, populating organizer...');
    await event.populate('organizer', 'name username avatar');
    
    console.log('🎉 Event created successfully:', event._id);
    res.status(201).json(event);
  } catch (error) {
    console.error('❌ Error creating event:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data format' 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Event with this title already exists' 
      });
    }
    
    // Handle file upload errors
    if (error.message && error.message.includes('file')) {
      return res.status(400).json({ 
        error: 'File upload error: ' + error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('organizer', 'name username avatar')
      .populate('group', 'name avatar')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.getUpcomingEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search events
exports.searchEvents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });
    
    const events = await Event.searchEvents(q, req.userId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('organizer', 'name username avatar')
      .populate('group', 'name avatar')
      .populate('attendees.user', 'name username avatar');
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (!event.canView(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    console.log('Updating event with data:', req.body);
    console.log('File:', req.file);
    
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Handle cover image
    if (req.file) {
      // Delete old cover image from Cloudinary if it exists
      if (event.coverImage && event.coverImage.includes('cloudinary.com')) {
        try {
          const { deleteFromCloudinary } = require('../config/cloudinary');
          const publicId = event.coverImage.split('/').pop().split('.')[0]; // Extract public ID
          await deleteFromCloudinary(publicId);
          console.log('✅ Old cover image deleted from Cloudinary:', publicId);
        } catch (error) {
          console.error('❌ Error deleting old cover image:', error);
        }
      }
      event.coverImage = req.file.path; // Cloudinary secure URL
    }
    
    // Handle location data properly
    if (req.body['location[address]'] || req.body.location) {
      // Handle location data safely
      let locationAddress = '';
      
      if (req.body['location[address]']) {
        // Handle location[address] field
        if (typeof req.body['location[address]'] === 'string') {
          locationAddress = req.body['location[address]'];
        } else if (req.body['location[address]'] && typeof req.body['location[address]'] === 'object') {
          // If it's an object, try to extract address property
          locationAddress = req.body['location[address]'].address || '';
        } else {
          locationAddress = String(req.body['location[address]'] || '');
        }
      } else if (req.body.location) {
        // Handle location field
        if (typeof req.body.location === 'string') {
          locationAddress = req.body.location;
        } else if (req.body.location && typeof req.body.location === 'object') {
          // If it's an object, try to extract address property
          locationAddress = req.body.location.address || '';
        } else {
          locationAddress = String(req.body.location || '');
        }
      }
      
      event.location = {
        address: locationAddress
      };
    }
    
    // Handle tags data
    if (req.body.tags) {
      try {
        event.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        event.tags = [];
      }
    }
    
    // Update other fields with validation
    if (req.body.title) {
      if (!req.body.title.trim()) {
        return res.status(400).json({ error: 'Event title cannot be empty.' });
      }
      event.title = req.body.title.trim();
    }
    
    if (req.body.description !== undefined) {
      event.description = req.body.description || '';
    }
    
    if (req.body.startDate) {
      const startDate = new Date(req.body.startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start date format.' });
      }
      event.startDate = startDate;
    }
    
    if (req.body.endDate) {
      const endDate = new Date(req.body.endDate);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid end date format.' });
      }
      event.endDate = endDate;
    }
    
    // Validate that end date is after start date if both are provided
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date.' });
      }
    }
    
    if (req.body.category) {
      const validCategories = ['business', 'education', 'entertainment', 'health', 'sports', 'technology', 'travel', 'social', 'other'];
      if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({ error: 'Invalid category.' });
      }
      event.category = req.body.category;
    }
    
    if (req.body.privacy) {
      const validPrivacy = ['public', 'private', 'group'];
      if (!validPrivacy.includes(req.body.privacy)) {
        return res.status(400).json({ error: 'Invalid privacy setting.' });
      }
      event.privacy = req.body.privacy;
    }
    
    if (req.body.groupId) event.group = req.body.groupId;
    
    console.log('Event data to save:', event);
    
    await event.save();
    await event.populate('organizer', 'name username avatar');
    
    console.log('Event updated successfully:', event._id);
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data format' 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Event with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Attend event
exports.attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.addAttendee(req.userId, 'going');
    res.json({ message: 'Event attendance updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Maybe attend event
exports.maybeAttendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.addAttendee(req.userId, 'maybe');
    res.json({ message: 'Event attendance updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Decline event
exports.declineEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.addAttendee(req.userId, 'not_going');
    res.json({ message: 'Event attendance updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove attendance
exports.removeAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.removeAttendee(req.userId);
    res.json({ message: 'Attendance removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Invite user to event
exports.inviteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await event.addAttendee(userId, 'invited', req.userId);
    res.json({ message: 'User invited to event' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Invite multiple users
exports.inviteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    for (const userId of userIds) {
      await event.addAttendee(userId, 'invited', req.userId);
    }
    
    res.json({ message: 'Users invited to event' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event invitations
exports.getEventInvitations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const invitations = event.attendees.filter(a => a.status === 'invited');
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.updateAttendeeStatus(req.userId, 'going');
    res.json({ message: 'Invitation accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Decline invitation
exports.declineInvitation = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.updateAttendeeStatus(req.userId, 'not_going');
    res.json({ message: 'Invitation declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add ticket
exports.addTicket = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await event.addTicket(req.body);
    res.json({ message: 'Ticket added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update ticket
exports.updateTicket = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await event.updateTicket(req.params.ticketId, req.body);
    res.json({ message: 'Ticket updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    event.tickets = event.tickets.filter(t => t._id.toString() !== req.params.ticketId);
    await event.save();
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Purchase ticket
exports.purchaseTicket = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    await event.purchaseTicket(req.params.ticketId, req.userId);
    res.json({ message: 'Ticket purchased' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event tickets
exports.getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    res.json(event.tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event posts
exports.getEventPosts = async (req, res) => {
  try {
    // Placeholder - implement when post model supports events
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create event post
exports.createEventPost = async (req, res) => {
  try {
    // Placeholder - implement when post model supports events
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event photos
exports.getEventPhotos = async (req, res) => {
  try {
    // Placeholder - implement when photo model is created
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload event photos
exports.uploadEventPhotos = async (req, res) => {
  try {
    // Placeholder - implement when photo model is created
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event attendees
exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendees.user', 'name username avatar');
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    res.json(event.attendees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get going attendees
exports.getGoingAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendees.user', 'name username avatar');
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const goingAttendees = event.attendees.filter(a => a.status === 'going');
    res.json(goingAttendees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get maybe attendees
exports.getMaybeAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendees.user', 'name username avatar');
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const maybeAttendees = event.attendees.filter(a => a.status === 'maybe');
    res.json(maybeAttendees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get not going attendees
exports.getNotGoingAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('attendees.user', 'name username avatar');
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const notGoingAttendees = event.attendees.filter(a => a.status === 'not_going');
    res.json(notGoingAttendees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel event
exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    event.isCancelled = true;
    event.cancellationReason = req.body.reason;
    await event.save();
    
    res.json({ message: 'Event cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Feature event
exports.featureEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    event.isFeatured = true;
    await event.save();
    
    res.json({ message: 'Event featured' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfeature event
exports.unfeatureEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    event.isFeatured = false;
    await event.save();
    
    res.json({ message: 'Event unfeatured' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event stats
exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(event.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event categories
exports.getEventCategories = async (req, res) => {
  try {
    const categories = [
      'business', 'education', 'entertainment', 'health', 
      'sports', 'technology', 'travel', 'social', 'other'
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get events by category
exports.getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ 
      category, 
      isActive: true, 
      isCancelled: false 
    })
    .populate('organizer', 'name username avatar')
    .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recommended events
exports.getRecommendedEvents = async (req, res) => {
  try {
    // Placeholder - implement recommendation algorithm
    const events = await Event.find({ 
      isActive: true, 
      isCancelled: false,
      startDate: { $gte: new Date() }
    })
    .populate('organizer', 'name username avatar')
    .limit(10)
    .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get nearby events
exports.getNearbyEvents = async (req, res) => {
  try {
    // Placeholder - implement location-based search
    const events = await Event.find({ 
      isActive: true, 
      isCancelled: false,
      'location.coordinates': { $exists: true }
    })
    .populate('organizer', 'name username avatar')
    .limit(10)
    .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 