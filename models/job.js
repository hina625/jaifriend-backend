const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  location: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000
  },
  salaryRange: {
    minimum: { 
      type: Number, 
      required: true,
      min: 0
    },
    maximum: { 
      type: Number, 
      required: true,
      min: 0
    },
    currency: { 
      type: String, 
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'PKR']
    },
    type: { 
      type: String, 
      required: true,
      enum: ['Per Hour', 'Per Day', 'Per Week', 'Per Month', 'Per Year']
    }
  },
  jobType: { 
    type: String, 
    required: true,
    enum: ['Full time', 'Part time', 'Contract', 'Freelance', 'Internship', 'Temporary']
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Technology', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Sales', 'Design', 'Engineering', 'Administration', 'Customer Service', 'Other']
  },
  questions: [{
    question: { 
      type: String, 
      required: true,
      maxlength: 500
    }
  }],
  image: { 
    type: String 
  },
  pageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Page', 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  creatorName: {
    type: String,
    required: true
  },
  creatorAvatar: {
    type: String,
    default: '/avatars/1.png.png'
  },
  interestedCandidates: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
      default: 'pending'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better performance
jobSchema.index({ pageId: 1, createdAt: -1 });
jobSchema.index({ category: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ location: 1 });

module.exports = mongoose.model('Job', jobSchema);
