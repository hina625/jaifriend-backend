const Job = require('../models/job');
const User = require('../models/user');

// Create a new job
exports.createJob = async (req, res) => {
  try {
    console.log('Creating job with data:', req.body);
    
    const { 
      title, 
      location, 
      description, 
      salaryRange, 
      jobType, 
      category, 
      questions, 
      pageId 
    } = req.body;
    
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    if (!title || !location || !description || !salaryRange || !jobType || !category || !pageId) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const job = new Job({
      title,
      location,
      description,
      salaryRange,
      jobType,
      category,
      questions: questions || [],
      pageId,
      createdBy: req.userId,
      creatorName: user.name || user.username || 'Unknown User',
      creatorAvatar: user.avatar || '/avatars/1.png.png'
    });
    
    await job.save();
    await job.populate('createdBy', 'name username avatar');
    
    console.log('Job created successfully:', job._id);
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get jobs by page ID
exports.getJobsByPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    
    const jobs = await Job.find({ pageId, isActive: true })
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 });
    
    console.log(`Jobs fetched for page ${pageId}:`, jobs.length);
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id)
      .populate('createdBy', 'name username avatar')
      .populate('interestedCandidates.userId', 'name username avatar');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: err.message });
  }
};

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user already applied
    const alreadyApplied = job.interestedCandidates.some(
      candidate => candidate.userId.toString() === userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Add user to interested candidates
    job.interestedCandidates.push({
      userId,
      appliedAt: new Date(),
      status: 'pending'
    });

    await job.save();
    
    res.json({
      success: true,
      message: 'Application submitted successfully',
      interestedCandidatesCount: job.interestedCandidates.length
    });
  } catch (err) {
    console.error('Error applying for job:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the creator of the job
    if (job.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own jobs' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the creator of the job
    if (job.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own jobs' });
    }

    await Job.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: err.message });
  }
};
