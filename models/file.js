const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: { 
    type: String, 
    required: true 
  },
  filename: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String 
  },
  mimetype: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  extension: { 
    type: String 
  },
  category: {
    type: String,
    enum: [
      'document', 'spreadsheet', 'presentation', 'pdf', 'text', 'archive',
      'image', 'video', 'audio', 'code', 'other'
    ],
    default: 'other'
  },
  isDownloadable: { 
    type: Boolean, 
    default: true 
  },
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
fileSchema.index({ postId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ category: 1 });
fileSchema.index({ mimetype: 1 });

// Pre-save middleware to set file extension and category
fileSchema.pre('save', function(next) {
  // Extract file extension
  if (this.originalName) {
    this.extension = this.originalName.split('.').pop().toLowerCase();
  }
  
  // Set category based on mimetype
  if (this.mimetype) {
    if (this.mimetype.startsWith('image/')) {
      this.category = 'image';
    } else if (this.mimetype.startsWith('video/')) {
      this.category = 'video';
    } else if (this.mimetype.startsWith('audio/')) {
      this.category = 'audio';
    } else if (this.mimetype.includes('pdf')) {
      this.category = 'pdf';
    } else if (this.mimetype.includes('word') || this.mimetype.includes('document')) {
      this.category = 'document';
    } else if (this.mimetype.includes('excel') || this.mimetype.includes('spreadsheet')) {
      this.category = 'spreadsheet';
    } else if (this.mimetype.includes('powerpoint') || this.mimetype.includes('presentation')) {
      this.category = 'presentation';
    } else if (this.mimetype.includes('zip') || this.mimetype.includes('rar') || this.mimetype.includes('tar')) {
      this.category = 'archive';
    } else if (this.mimetype.includes('text/') || this.mimetype.includes('javascript') || this.mimetype.includes('python')) {
      this.category = 'code';
    } else {
      this.category = 'other';
    }
  }
  
  next();
});

// Method to increment download count
fileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to get file size in human readable format
fileSchema.methods.getHumanReadableSize = function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Method to check if file is image
fileSchema.methods.isImage = function() {
  return this.category === 'image';
};

// Method to check if file is video
fileSchema.methods.isVideo = function() {
  return this.category === 'video';
};

// Method to check if file is audio
fileSchema.methods.isAudio = function() {
  return this.category === 'audio';
};

// Method to check if file is document
fileSchema.methods.isDocument = function() {
  return ['document', 'spreadsheet', 'presentation', 'pdf', 'text'].includes(this.category);
};

module.exports = mongoose.model('File', fileSchema);
