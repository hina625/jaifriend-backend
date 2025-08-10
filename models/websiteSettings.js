const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema({
  // Website Mode Settings
  websiteMode: {
    type: String,
    enum: ['public', 'private', 'maintenance'],
    default: 'public'
  },
  
  // General Configuration
  siteName: {
    type: String,
    default: 'Jaifriend'
  },
  siteTitle: {
    type: String,
    default: 'Jaifriend - Connect, Share, and Discover Together'
  },
  siteDescription: {
    type: String,
    default: 'Social media platform, online communities, connect with friends'
  },
  siteKeywords: {
    type: String,
    default: 'Social media platform, online communities, connect with friends, Jaifriend networking'
  },
  
  // Features Configuration
  features: {
    registration: {
      type: Boolean,
      default: true
    },
    emailVerification: {
      type: Boolean,
      default: true
    },
    smsVerification: {
      type: Boolean,
      default: false
    },
    socialLogin: {
      type: Boolean,
      default: true
    },
    fileUpload: {
      type: Boolean,
      default: true
    },
    chat: {
      type: Boolean,
      default: true
    },
    videoCall: {
      type: Boolean,
      default: true
    },
    audioCall: {
      type: Boolean,
      default: true
    },
    groups: {
      type: Boolean,
      default: true
    },
    pages: {
      type: Boolean,
      default: true
    },
    marketplace: {
      type: Boolean,
      default: true
    },
    forum: {
      type: Boolean,
      default: true
    },
    games: {
      type: Boolean,
      default: true
    },
    events: {
      type: Boolean,
      default: true
    },
    funding: {
      type: Boolean,
      default: true
    },
    advertising: {
      type: Boolean,
      default: true
    },
    movies: {
      type: Boolean,
      default: true
    },
    reels: {
      type: Boolean,
      default: true
    },
    albums: {
      type: Boolean,
      default: true
    },
    stories: {
      type: Boolean,
      default: true
    },
    liveStreaming: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    search: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: true
    },
    likes: {
      type: Boolean,
      default: true
    },
    shares: {
      type: Boolean,
      default: true
    },
    bookmarks: {
      type: Boolean,
      default: true
    },
    reports: {
      type: Boolean,
      default: true
    },
    moderation: {
      type: Boolean,
      default: true
    }
  },
  
  // General Settings
  general: {
    // User Configuration
    onlineUsers: {
      type: Boolean,
      default: true
    },
    userLastSeen: {
      type: Boolean,
      default: true
    },
    userAccountDeletion: {
      type: Boolean,
      default: true
    },
    profileBackgroundChange: {
      type: Boolean,
      default: false
    },
    friendsSystem: {
      type: Boolean,
      default: false
    },
    connectivityLimit: {
      type: Number,
      default: 5000
    },
    userInviteSystem: {
      type: Boolean,
      default: true
    },
    inviteLinks: {
      type: Number,
      default: 10
    },
    inviteTimeframe: {
      type: String,
      enum: ['1 Day', '1 Week', '1 Month', '3 Months', '6 Months'],
      default: '1 Month'
    },
    
    // Security Settings
    accountValidation: {
      type: Boolean,
      default: false
    },
    validationMethod: {
      type: String,
      enum: ['E-mail address', 'SMS'],
      default: 'E-mail address'
    },
    recaptcha: {
      type: Boolean,
      default: false
    },
    recaptchaKey: {
      type: String,
      default: ''
    },
    recaptchaSecret: {
      type: String,
      default: ''
    },
    preventBadLogin: {
      type: Boolean,
      default: true
    },
    loginLimit: {
      type: Number,
      default: 4
    },
    lockoutTime: {
      type: Number,
      default: 10
    },
    registrationLimits: {
      type: Number,
      default: 10
    },
    reservedUsernamesSystem: {
      type: Boolean,
      default: false
    },
    reservedUsernames: {
      type: String,
      default: 'maintenance,get_news_feed,video-call,video-call-api,home,welcome,register,confirm-sms,confirm-sms-password,forgot-password,reset-password,start-up,activate,search,timeline,pages,suggested-pages,liked-pages,joined_groups,go-pro,page,poke,most_liked,groups,suggested-groups,liked-groups,joined_groups,group,game,games,most_liked_games,liked-games,played-games,game,post,posts,most_liked_posts,liked-posts,my_posts,my-posts,create-post,create_post,edit-post,edit_post,delete-post,delete_post,share-post,share_post,comment,comments,like,likes,dislike,dislikes,share,shares,report,reports,block,blocks,unblock,unblocks,delete,deletes,edit,edits,create,creates,update,updates,remove,removes,add,adds,get,gets,set,sets,put,puts,post,posts,delete,deletes,edit,edits,create,creates,update,updates,remove,removes,add,adds,get,gets,set,sets,put,puts'
    },
    
    // System Settings
    censoredWords: {
      type: String,
      default: ''
    },
    homePageCaching: {
      type: String,
      enum: ['Disabled', 'Every 1 minute', 'Every 2 minutes', 'Every 5 minutes', 'Every 10 minutes'],
      default: 'Every 2 minutes'
    },
    profilePageCaching: {
      type: String,
      enum: ['Disabled', 'Every 1 minute', 'Every 2 minutes', 'Every 5 minutes', 'Every 10 minutes'],
      default: 'Every 2 minutes'
    },
    exchangerateApiKey: {
      type: String,
      default: ''
    },
    disableStartPage: {
      type: Boolean,
      default: false
    },
    
    // Notifications
    emailNotifications: {
      type: Boolean,
      default: true
    },
    profileVisitNotifications: {
      type: Boolean,
      default: true
    },
    notificationOnNewPost: {
      type: Boolean,
      default: true
    }
  },
  
  // API Keys
  apiKeys: {
    googleMaps: {
      enabled: {
        type: Boolean,
        default: true
      },
      key: {
        type: String,
        default: ''
      }
    },
    yandexMaps: {
      enabled: {
        type: Boolean,
        default: false
      },
      key: {
        type: String,
        default: ''
      }
    },
    googleTranslation: {
      enabled: {
        type: Boolean,
        default: false
      },
      key: {
        type: String,
        default: ''
      }
    },
    yandexTranslation: {
      enabled: {
        type: Boolean,
        default: false
      },
      key: {
        type: String,
        default: ''
      }
    },
    youtube: {
      key: {
        type: String,
        default: ''
      }
    },
    giphy: {
      key: {
        type: String,
        default: ''
      }
    }
  },
  
  // Native App Links
  nativeApps: {
    android: {
      messenger: {
        type: String,
        default: ''
      },
      timeline: {
        type: String,
        default: ''
      }
    },
    ios: {
      messenger: {
        type: String,
        default: ''
      },
      timeline: {
        type: String,
        default: ''
      }
    },
    windows: {
      messenger: {
        type: String,
        default: ''
      }
    }
  },
  
  // Analytics
  analytics: {
    googleAnalytics: {
      type: String,
      default: ''
    }
  },
  
  // Maintenance Mode
  maintenance: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'Site is under maintenance. Please check back later.'
    },
    allowedIPs: [{
      type: String
    }]
  },
  
  // Cache Settings
  cache: {
    enabled: {
      type: Boolean,
      default: true
    },
    duration: {
      type: Number,
      default: 3600 // 1 hour in seconds
    }
  },
  
  // Security Settings
  security: {
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 900 // 15 minutes in seconds
    },
    passwordMinLength: {
      type: Number,
      default: 8
    },
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 86400 // 24 hours in seconds
    }
  },
  
  // Email Settings
  email: {
    provider: {
      type: String,
      enum: ['smtp', 'sendgrid', 'mailgun'],
      default: 'smtp'
    },
    host: {
      type: String,
      default: ''
    },
    port: {
      type: Number,
      default: 587
    },
    username: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: ''
    },
    fromEmail: {
      type: String,
      default: ''
    },
    fromName: {
      type: String,
      default: 'Jaifriend'
    }
  },
  
  // SMS Settings
  sms: {
    provider: {
      type: String,
      enum: ['twilio', 'nexmo', 'aws'],
      default: 'twilio'
    },
    accountSid: {
      type: String,
      default: ''
    },
    authToken: {
      type: String,
      default: ''
    },
    fromNumber: {
      type: String,
      default: ''
    }
  },
  
  // File Upload Settings
  fileUpload: {
    enabled: {
      type: Boolean,
      default: true
    },
    videoEnabled: {
      type: Boolean,
      default: true
    },
    reelsEnabled: {
      type: Boolean,
      default: true
    },
    audioEnabled: {
      type: Boolean,
      default: false
    },
    cssEnabled: {
      type: Boolean,
      default: false
    },
    allowedExtensions: [{
      type: String,
      default: ['jpg', 'png', 'jpeg', 'gif', 'mkv', 'docx', 'zip', 'rar', 'pdf', 'doc', 'mp3', 'mp4', 'flv', 'wav', 'txt', 'mov', 'avi', 'webm', 'wav', 'mpeg']
    }],
    allowedMimeTypes: [{
      type: String,
      default: ['text/plain', 'video/mp4', 'video/mov', 'video/mpeg', 'video/flv', 'video/avi', 'video/webm', 'audio/wav']
    }],
    maxFileSize: {
      type: String,
      default: '96 MB'
    },
    imageCompressionLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low'
    },
    ffmpeg: {
      enabled: {
        type: Boolean,
        default: true
      },
      path: {
        type: String,
        default: './ffmpeg/ffmpeg'
      },
      allowedExtensions: [{
        type: String,
        default: ['.mov', '.mp4', '.m4a', '.3gp', '.3g2', '.mj2', '.asf', '.avi', '.flv', '.webm', '.m4v', '.mpeg', '.mpeg', '.ogv', '.mkv', '.webm', '.mov']
      }],
      allowedMimeTypes: [{
        type: String,
        default: ['application/vnd.ms-asf', 'video/x-msvideo', 'video/x-flv', 'video/webm', 'video/x-m4v', 'video/mp4']
      }]
    },
    storage: {
      amazonS3: {
        enabled: {
          type: Boolean,
          default: false
        },
        bucketName: {
          type: String,
          default: ''
        },
        key: {
          type: String,
          default: ''
        },
        secretKey: {
          type: String,
          default: ''
        },
        customEndpoint: {
          type: String,
          default: ''
        },
        region: {
          type: String,
          default: 'US East (N. Virginia) us-east-1'
        }
      },
      ftp: {
        enabled: {
          type: Boolean,
          default: false
        },
        hostname: {
          type: String,
          default: ''
        },
        username: {
          type: String,
          default: ''
        },
        password: {
          type: String,
          default: ''
        },
        port: {
          type: String,
          default: '21'
        },
        path: {
          type: String,
          default: '/'
        },
        endpoint: {
          type: String,
          default: ''
        }
      },
      digitalocean: {
        enabled: {
          type: Boolean,
          default: false
        },
        spaceName: {
          type: String,
          default: ''
        },
        key: {
          type: String,
          default: ''
        },
        secret: {
          type: String,
          default: ''
        },
        customEndpoint: {
          type: String,
          default: ''
        },
        region: {
          type: String,
          default: 'New York [NYC1]'
        }
      },
      googleCloud: {
        enabled: {
          type: Boolean,
          default: false
        },
        bucketName: {
          type: String,
          default: ''
        },
        filePath: {
          type: String,
          default: ''
        },
        customEndpoint: {
          type: String,
          default: ''
        }
      },
      backblaze: {
        enabled: {
          type: Boolean,
          default: false
        },
        bucketId: {
          type: String,
          default: ''
        },
        bucketName: {
          type: String,
          default: ''
        },
        region: {
          type: String,
          default: ''
        },
        accessKeyId: {
          type: String,
          default: ''
        },
        accessKey: {
          type: String,
          default: ''
        },
        customEndpoint: {
          type: String,
          default: ''
        }
      },
      wasabi: {
        enabled: {
          type: Boolean,
          default: false
        },
        bucketName: {
          type: String,
          default: ''
        },
        accessKey: {
          type: String,
          default: ''
        },
        secretKey: {
          type: String,
          default: ''
        },
        customEndpoint: {
          type: String,
          default: ''
        },
        region: {
          type: String,
          default: 'us-west-1'
        }
      }
    }
  },
  
  // Social Login Settings
  socialLogin: {
    google: {
      enabled: {
        type: Boolean,
        default: false
      },
      clientId: {
        type: String,
        default: ''
      },
      clientSecret: {
        type: String,
        default: ''
      }
    },
    facebook: {
      enabled: {
        type: Boolean,
        default: false
      },
      appId: {
        type: String,
        default: ''
      },
      appSecret: {
        type: String,
        default: ''
      }
    },
    twitter: {
      enabled: {
        type: Boolean,
        default: false
      },
      consumerKey: {
        type: String,
        default: ''
      },
      consumerSecret: {
        type: String,
        default: ''
      }
    }
  },
  
  // NodeJS Settings
  nodejs: {
    port: {
      type: Number,
      default: 5000
    },
    environment: {
      type: String,
      enum: ['development', 'production', 'test'],
      default: 'development'
    },
    corsOrigin: {
      type: String,
      default: '*'
    }
  },
  
  // CronJob Settings
  cronJobs: {
    cleanupTempFiles: {
      enabled: {
        type: Boolean,
        default: true
      },
      schedule: {
        type: String,
        default: '0 2 * * *' // Daily at 2 AM
      }
    },
    sendNotifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      schedule: {
        type: String,
        default: '*/5 * * * *' // Every 5 minutes
      }
    },
    updateStatistics: {
      enabled: {
        type: Boolean,
        default: true
      },
      schedule: {
        type: String,
        default: '0 * * * *' // Every hour
      }
    }
  },
  
  // AI Settings
  ai: {
    openai: {
      enabled: {
        type: Boolean,
        default: false
      },
      apiKey: {
        type: String,
        default: ''
      },
      model: {
        type: String,
        default: 'gpt-3.5-turbo'
      }
    },
    contentModeration: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['openai', 'aws', 'google'],
        default: 'openai'
      }
    },
    autoTagging: {
      enabled: {
        type: Boolean,
        default: false
      }
    },
    smartRecommendations: {
      enabled: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Create a single document for website settings
websiteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema); 