# Profile Backend Guide

This guide covers all the new profile-related backend functionality including profile photos, cover photos, and user management features.

## Table of Contents

1. [Overview](#overview)
2. [User Model Updates](#user-model-updates)
3. [API Endpoints](#api-endpoints)
4. [File Upload System](#file-upload-system)
5. [Testing](#testing)
6. [Usage Examples](#usage-examples)

## Overview

The profile backend system provides comprehensive functionality for:
- Profile photo management (upload, update, delete)
- Cover photo management
- User profile information updates
- User activity tracking
- User search and discovery
- Follow/unfollow functionality
- User blocking/unblocking
- Account management

## User Model Updates

The User model includes the following fields for profile management:

```javascript
{
  avatar: { type: String, default: '/avatars/1.png.png' },
  coverPhoto: { type: String, default: null },
  bio: { type: String, default: null, maxlength: 500 },
  status: { type: String, default: null, maxlength: 100 },
  location: { type: String, default: null },
  website: { type: String, default: null },
  workplace: { type: String, default: null },
  country: { type: String, default: null },
  address: { type: String, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
  dateOfBirth: { type: Date, default: null },
  phone: { type: String, default: null },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}
```

## API Endpoints

### Profile Management

#### 1. Get Current User Profile
```
GET /api/users/profile/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user_id",
  "name": "User Name",
  "username": "username",
  "avatar": "/uploads/profile-photos/photo.jpg",
  "coverPhoto": "/uploads/cover-photos/cover.jpg",
  "bio": "User bio",
  "location": "City, Country",
  "website": "https://website.com",
  "workplace": "Company Name",
  "gender": "Male",
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "phone": "+1234567890",
  "following": 150,
  "followers": 200,
  "posts": 25,
  "albums": 5,
  "photos": 15,
  "videos": 10,
  "isOnline": true,
  "lastSeen": "2024-01-01T12:00:00.000Z",
  "isVerified": false,
  "isPrivate": false
}
```

#### 2. Update Profile Information
```
PUT /api/users/profile/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "bio": "Updated bio",
  "location": "New City",
  "website": "https://newwebsite.com",
  "workplace": "New Company",
  "gender": "Female",
  "dateOfBirth": "1995-01-01",
  "phone": "+1234567890"
}
```

#### 3. Update Profile Photo
```
PUT /api/users/profile/photo
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoUrl": "/uploads/profile-photos/new-photo.jpg"
}
```

#### 4. Update Cover Photo
```
PUT /api/users/profile/cover
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverUrl": "/uploads/cover-photos/new-cover.jpg"
}
```

### File Upload

#### 1. Upload Profile Photo
```
POST /api/upload/profile-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- profilePhoto: [file]
```

#### 2. Upload Cover Photo
```
POST /api/upload/cover-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- coverPhoto: [file]
```

#### 3. Upload Post Media
```
POST /api/upload/post-media
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- postMedia: [files] (up to 10 files)
```

### User Discovery

#### 1. Search Users
```
GET /api/users/search?q=search_term
Authorization: Bearer <token>
```

#### 2. Get Suggested Users
```
GET /api/users/suggested
Authorization: Bearer <token>
```

#### 3. Get User by ID
```
GET /api/users/:userId
Authorization: Bearer <token>
```

### User Interactions

#### 1. Follow/Unfollow User
```
POST /api/users/:userId/follow
Authorization: Bearer <token>
```

#### 2. Block/Unblock User
```
POST /api/users/:userId/block
Authorization: Bearer <token>
```

#### 3. Get User Posts
```
GET /api/users/:userId/posts
Authorization: Bearer <token>
```

#### 4. Get User Albums
```
GET /api/users/:userId/albums
Authorization: Bearer <token>
```

#### 5. Get User Followers
```
GET /api/users/:userId/followers
Authorization: Bearer <token>
```

#### 6. Get User Following
```
GET /api/users/:userId/following
Authorization: Bearer <token>
```

### Activity & Analytics

#### 1. Get User Activity
```
GET /api/users/activity?page=1&limit=10
Authorization: Bearer <token>
```

#### 2. Delete Account
```
DELETE /api/users/account
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "user_password"
}
```

## File Upload System

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per upload: 10 files

### File Storage Structure
```
uploads/
├── profile-photos/
├── cover-photos/
├── post-media/
└── general/
```

### File Naming Convention
Files are automatically renamed with the format:
```
{fieldname}-{timestamp}-{random}.{extension}
```

Example: `profilePhoto-1704067200000-123456789.jpg`

## Testing

### Running Tests
```bash
cd my-express-app
node test-profile-backend.js
```

### Test Coverage
The test script covers:
- ✅ Authentication
- ✅ Profile retrieval and updates
- ✅ Photo uploads (profile and cover)
- ✅ User search and discovery
- ✅ Follow/unfollow functionality
- ✅ User blocking
- ✅ Activity tracking
- ✅ User posts and albums retrieval

## Usage Examples

### Frontend Integration

#### 1. Update Profile Photo
```javascript
const updateProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('profilePhoto', file);

  const response = await fetch('http://localhost:5000/api/upload/profile-photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  return result.avatar;
};
```

#### 2. Update Profile Information
```javascript
const updateProfile = async (profileData) => {
  const response = await fetch('http://localhost:5000/api/users/profile/update', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  return await response.json();
};
```

#### 3. Follow User
```javascript
const followUser = async (userId) => {
  const response = await fetch(`http://localhost:5000/api/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

#### 4. Search Users
```javascript
const searchUsers = async (query) => {
  const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing parameters, invalid data)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (user, post, etc. not found)
- `500`: Internal Server Error

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Type Validation**: Only allowed file types can be uploaded
3. **File Size Limits**: Prevents large file uploads
4. **User Authorization**: Users can only modify their own profiles
5. **Input Validation**: All inputs are validated before processing
6. **File Cleanup**: Old files are automatically deleted when replaced

## Performance Considerations

1. **File Compression**: Consider implementing image compression
2. **CDN Integration**: Use CDN for serving static files
3. **Pagination**: Large datasets are paginated
4. **Caching**: Implement caching for frequently accessed data
5. **Database Indexing**: Ensure proper indexing on user fields

## Future Enhancements

1. **Image Cropping**: Add image cropping functionality
2. **Video Thumbnails**: Generate thumbnails for video uploads
3. **Profile Verification**: Implement email/phone verification
4. **Privacy Settings**: Add granular privacy controls
5. **Activity Analytics**: Enhanced user activity tracking
6. **Social Features**: Add more social interaction features

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure upload directory has write permissions

2. **Authentication Errors**
   - Verify token is valid and not expired
   - Check token format: `Bearer <token>`

3. **Profile Updates Fail**
   - Validate all required fields
   - Check field length limits
   - Ensure user exists and is authenticated

4. **Follow/Block Operations Fail**
   - Verify target user exists
   - Check if user is trying to follow/block themselves
   - Ensure user is not already following/blocked

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=profile-backend:*
```

## Support

For issues or questions:
1. Check the error logs in the console
2. Verify all required dependencies are installed
3. Ensure MongoDB is running and accessible
4. Test with the provided test script
5. Check network connectivity and CORS settings 