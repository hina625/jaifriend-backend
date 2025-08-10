const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  coverImage: {
    type: String,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    onlineUrl: String,
    onlinePlatform: String
  },
  category: {
    type: String,
    required: true,
    enum: ['business', 'education', 'entertainment', 'health', 'sports', 'technology', 'travel', 'social', 'other']
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  privacy: {
    type: String,
    enum: ['public', 'private', 'group'],
    default: 'public'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going', 'invited'],
      default: 'invited'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    isHost: {
      type: Boolean,
      default: false
    }
  }],
  tickets: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    quantity: {
      type: Number,
      required: true
    },
    sold: {
      type: Number,
      default: 0
    },
    availableFrom: Date,
    availableUntil: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowPhotos: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxAttendees: {
      type: Number,
      default: null
    },
    allowInvites: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    attendeeCount: {
      type: Number,
      default: 0
    },
    maybeCount: {
      type: Number,
      default: 0
    },
    notGoingCount: {
      type: Number,
      default: 0
    },
    inviteCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes for better performance
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ group: 1 });
eventSchema.index({ privacy: 1, category: 1 });
eventSchema.index({ 'attendees.user': 1 });
eventSchema.index({ isActive: 1, isCancelled: 1 });

// Pre-save middleware to update stats
eventSchema.pre('save', function(next) {
  if (this.isModified('attendees')) {
    this.stats.attendeeCount = this.attendees.filter(a => a.status === 'going').length;
    this.stats.maybeCount = this.attendees.filter(a => a.status === 'maybe').length;
    this.stats.notGoingCount = this.attendees.filter(a => a.status === 'not_going').length;
    this.stats.inviteCount = this.attendees.filter(a => a.status === 'invited').length;
  }
  next();
});

// Method to add attendee
eventSchema.methods.addAttendee = async function(userId, status = 'invited', invitedBy = null) {
  const existingAttendee = this.attendees.find(a => a.user.toString() === userId.toString());
  
  if (existingAttendee) {
    existingAttendee.status = status;
    existingAttendee.respondedAt = new Date();
  } else {
    this.attendees.push({
      user: userId,
      status: status,
      invitedBy: invitedBy,
      invitedAt: new Date(),
      respondedAt: status !== 'invited' ? new Date() : null
    });
  }
  
  return await this.save();
};

// Method to remove attendee
eventSchema.methods.removeAttendee = async function(userId) {
  this.attendees = this.attendees.filter(a => a.user.toString() !== userId.toString());
  return await this.save();
};

// Method to update attendee status
eventSchema.methods.updateAttendeeStatus = async function(userId, status) {
  const attendee = this.attendees.find(a => a.user.toString() === userId.toString());
  if (attendee) {
    attendee.status = status;
    attendee.respondedAt = new Date();
    return await this.save();
  }
  throw new Error('Attendee not found');
};

// Method to check if user is attending
eventSchema.methods.isAttending = function(userId) {
  return this.attendees.some(a => a.user.toString() === userId.toString() && a.status === 'going');
};

// Method to check if user is invited
eventSchema.methods.isInvited = function(userId) {
  return this.attendees.some(a => a.user.toString() === userId.toString());
};

// Method to check if user can view event
eventSchema.methods.canView = function(userId) {
  if (this.privacy === 'public') return true;
  if (this.organizer.toString() === userId.toString()) return true;
  if (this.privacy === 'group' && this.group) {
    // Check if user is member of the group
    // This would need to be implemented based on your group model
    return true;
  }
  return this.isInvited(userId);
};

// Method to add ticket
eventSchema.methods.addTicket = function(ticketData) {
  this.tickets.push(ticketData);
  return this.save();
};

// Method to update ticket
eventSchema.methods.updateTicket = async function(ticketId, updates) {
  const ticket = this.tickets.id(ticketId);
  if (ticket) {
    Object.assign(ticket, updates);
    return await this.save();
  }
  throw new Error('Ticket not found');
};

// Method to purchase ticket
eventSchema.methods.purchaseTicket = async function(ticketId, userId) {
  const ticket = this.tickets.id(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.sold >= ticket.quantity) throw new Error('Ticket sold out');
  if (!ticket.isActive) throw new Error('Ticket not available');
  
  ticket.sold += 1;
  return await this.save();
};

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(userId = null) {
  const query = {
    startDate: { $gte: new Date() },
    isActive: true,
    isCancelled: false
  };
  
  if (userId) {
    query.$or = [
      { privacy: 'public' },
      { organizer: userId },
      { 'attendees.user': userId }
    ];
  } else {
    query.privacy = 'public';
  }
  
  return this.find(query)
    .populate('organizer', 'name username avatar')
    .populate('group', 'name avatar')
    .populate('attendees.user', 'name username avatar')
    .sort({ startDate: 1 });
};

// Static method to search events
eventSchema.statics.searchEvents = function(query, userId = null) {
  const searchQuery = {
    $and: [
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      },
      { isActive: true, isCancelled: false }
    ]
  };
  
  if (userId) {
    searchQuery.$and.push({
      $or: [
        { privacy: 'public' },
        { organizer: userId },
        { 'attendees.user': userId }
      ]
    });
  } else {
    searchQuery.$and.push({ privacy: 'public' });
  }
  
  return this.find(searchQuery)
    .populate('organizer', 'name username avatar')
    .populate('group', 'name avatar')
    .populate('attendees.user', 'name username avatar')
    .sort({ startDate: 1 });
};

// Virtual for total tickets sold
eventSchema.virtual('totalTicketsSold').get(function() {
  return this.tickets.reduce((total, ticket) => total + ticket.sold, 0);
});

// Virtual for total tickets available
eventSchema.virtual('totalTicketsAvailable').get(function() {
  return this.tickets.reduce((total, ticket) => total + (ticket.quantity - ticket.sold), 0);
});

// Virtual for event status
eventSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.isCancelled) return 'cancelled';
  if (this.endDate < now) return 'ended';
  if (this.startDate <= now && this.endDate >= now) return 'ongoing';
  if (this.startDate > now) return 'upcoming';
  return 'unknown';
});

module.exports = mongoose.model('Event', eventSchema); 