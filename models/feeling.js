const mongoose = require('mongoose');

const feelingSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: [
      'happy', 'excited', 'grateful', 'loved', 'blessed', 'amazed',
      'sad', 'lonely', 'heartbroken', 'disappointed', 'worried', 'anxious',
      'angry', 'frustrated', 'annoyed', 'irritated', 'furious', 'rage',
      'surprised', 'shocked', 'confused', 'curious', 'wondering', 'amazed',
      'scared', 'afraid', 'terrified', 'nervous', 'tense', 'stressed',
      'calm', 'peaceful', 'relaxed', 'content', 'satisfied', 'fulfilled',
      'proud', 'accomplished', 'confident', 'strong', 'powerful', 'successful',
      'tired', 'exhausted', 'sleepy', 'lazy', 'bored', 'unmotivated'
    ]
  },
  intensity: { 
    type: Number, 
    min: 1, 
    max: 10, 
    default: 5 
  },
  emoji: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    maxlength: 200 
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
feelingSchema.index({ postId: 1 });
feelingSchema.index({ userId: 1 });
feelingSchema.index({ type: 1 });

// Static method to get feeling by type
feelingSchema.statics.getFeelingByType = function(type) {
  const feelings = {
    happy: { emoji: '😊', description: 'Feeling happy and content' },
    excited: { emoji: '🤩', description: 'Feeling excited and thrilled' },
    grateful: { emoji: '🙏', description: 'Feeling grateful and thankful' },
    loved: { emoji: '💕', description: 'Feeling loved and cherished' },
    blessed: { emoji: '🙌', description: 'Feeling blessed and fortunate' },
    amazed: { emoji: '😲', description: 'Feeling amazed and astonished' },
    sad: { emoji: '😢', description: 'Feeling sad and down' },
    lonely: { emoji: '😔', description: 'Feeling lonely and isolated' },
    heartbroken: { emoji: '💔', description: 'Feeling heartbroken and devastated' },
    disappointed: { emoji: '😞', description: 'Feeling disappointed and let down' },
    worried: { emoji: '😟', description: 'Feeling worried and concerned' },
    anxious: { emoji: '😰', description: 'Feeling anxious and nervous' },
    angry: { emoji: '😠', description: 'Feeling angry and mad' },
    frustrated: { emoji: '😤', description: 'Feeling frustrated and annoyed' },
    annoyed: { emoji: '😒', description: 'Feeling annoyed and irritated' },
    irritated: { emoji: '😤', description: 'Feeling irritated and bothered' },
    furious: { emoji: '😡', description: 'Feeling furious and enraged' },
    rage: { emoji: '🤬', description: 'Feeling rage and fury' },
    surprised: { emoji: '😮', description: 'Feeling surprised and shocked' },
    shocked: { emoji: '😱', description: 'Feeling shocked and stunned' },
    confused: { emoji: '😕', description: 'Feeling confused and puzzled' },
    curious: { emoji: '🤔', description: 'Feeling curious and wondering' },
    wondering: { emoji: '🤨', description: 'Feeling wondering and thinking' },
    scared: { emoji: '😨', description: 'Feeling scared and frightened' },
    afraid: { emoji: '😰', description: 'Feeling afraid and fearful' },
    terrified: { emoji: '😱', description: 'Feeling terrified and horrified' },
    nervous: { emoji: '😬', description: 'Feeling nervous and tense' },
    tense: { emoji: '😰', description: 'Feeling tense and stressed' },
    stressed: { emoji: '😫', description: 'Feeling stressed and overwhelmed' },
    calm: { emoji: '😌', description: 'Feeling calm and peaceful' },
    peaceful: { emoji: '😇', description: 'Feeling peaceful and serene' },
    relaxed: { emoji: '😴', description: 'Feeling relaxed and comfortable' },
    content: { emoji: '😊', description: 'Feeling content and satisfied' },
    satisfied: { emoji: '😌', description: 'Feeling satisfied and fulfilled' },
    fulfilled: { emoji: '😊', description: 'Feeling fulfilled and complete' },
    proud: { emoji: '😎', description: 'Feeling proud and accomplished' },
    accomplished: { emoji: '🏆', description: 'Feeling accomplished and successful' },
    confident: { emoji: '😤', description: 'Feeling confident and strong' },
    strong: { emoji: '💪', description: 'Feeling strong and powerful' },
    powerful: { emoji: '🔥', description: 'Feeling powerful and unstoppable' },
    successful: { emoji: '🎯', description: 'Feeling successful and victorious' },
    tired: { emoji: '😴', description: 'Feeling tired and sleepy' },
    exhausted: { emoji: '😫', description: 'Feeling exhausted and drained' },
    sleepy: { emoji: '😴', description: 'Feeling sleepy and drowsy' },
    lazy: { emoji: '😴', description: 'Feeling lazy and unmotivated' },
    bored: { emoji: '😑', description: 'Feeling bored and uninterested' },
    unmotivated: { emoji: '😐', description: 'Feeling unmotivated and uninspired' }
  };
  
  return feelings[type] || { emoji: '😊', description: 'Feeling something' };
};

module.exports = mongoose.model('Feeling', feelingSchema);
