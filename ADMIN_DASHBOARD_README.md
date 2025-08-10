# Admin Dashboard Backend Setup

## Overview
The admin dashboard provides real-time statistics and data management for the Jaifriend platform. It includes comprehensive analytics for users, posts, comments, groups, pages, games, and messages.

## Features

### 📊 Dashboard Statistics
- **Total Users**: Count of all registered users
- **Total Posts**: Count of all posts created
- **Total Pages**: Count of all pages created
- **Total Groups**: Count of all groups created
- **Total Games**: Count of all games created
- **Total Messages**: Count of all messages sent
- **Online Users**: Users active in the last 5 minutes
- **Total Comments**: Count of all comments on posts

### 📈 Monthly Chart
- Visual representation of posts and users activity by month
- Real-time data from the current year
- Interactive chart with proper scaling

### 🔧 API Endpoints

#### GET `/api/admin/stats`
Returns dashboard statistics and chart data.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalPosts": 1250,
    "totalPages": 5,
    "totalGroups": 12,
    "totalGames": 8,
    "totalMessages": 450,
    "onlineUsers": 23,
    "totalComments": 890
  },
  "chartData": [
    {
      "month": 1,
      "posts": 45,
      "users": 12
    }
    // ... more months
  ]
}
```

#### GET `/api/admin/users?page=1&limit=10`
Returns paginated list of users.

#### GET `/api/admin/posts?page=1&limit=10`
Returns paginated list of posts with user information.

#### GET `/api/admin/comments`
Returns all comments with post and user information.

#### GET `/api/admin/groups`
Returns all groups with creator information.

#### GET `/api/admin/pages`
Returns all pages with creator information.

#### GET `/api/admin/games`
Returns all games with creator information.

#### GET `/api/admin/messages?page=1&limit=10`
Returns paginated list of messages with sender and receiver information.

## Setup Instructions

### 1. Install Dependencies
```bash
cd my-express-app
npm install
```

### 2. Database Models
The following models are required:
- `User` (updated with `lastActive` field)
- `Post` (with comments array)
- `Group`
- `Page`
- `Game` (newly created)
- `Message` (newly created)

### 3. Seed Sample Data
To populate the database with sample data for testing:

```bash
cd my-express-app
node seedAdminData.js
```

This will create:
- 20 sample posts with comments
- 2 sample groups
- 2 sample pages
- 2 sample games
- 15 sample messages
- Mark 3 users as online

### 4. Start the Server
```bash
npm start
```

The admin API will be available at `http://localhost:5000/api/admin/`

## Authentication

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API includes comprehensive error handling:
- Database connection errors
- Missing models (returns 0 for counts)
- Authentication failures
- Invalid requests

## Frontend Integration

The frontend admin dashboard (`my-app/src/app/dashboard/admin/page.tsx`) is already configured to:
- Fetch real-time statistics
- Display loading states
- Handle errors gracefully
- Show interactive charts
- Format numbers with proper localization

## Monitoring

### Online Users
Users are considered "online" if they have been active in the last 5 minutes. The `lastActive` field in the User model is updated when users perform actions.

### Real-time Updates
The dashboard fetches fresh data on each page load. For real-time updates, consider implementing WebSocket connections or periodic refresh.

## Troubleshooting

### Common Issues

1. **No data showing**: Run the seed script to populate sample data
2. **Authentication errors**: Ensure you're logged in and have a valid token
3. **Database connection**: Verify MongoDB is running and accessible
4. **CORS issues**: Check that the frontend can access the backend API

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
DEBUG=admin:*
npm start
```

## Security Considerations

- All endpoints require authentication
- Admin privileges should be implemented for sensitive operations
- Rate limiting should be added for production use
- Input validation and sanitization are implemented
- Database queries are optimized with proper indexing

## Performance Optimization

- Database indexes are created for common queries
- Pagination is implemented for large datasets
- Aggregation pipelines are optimized for statistics
- Error handling prevents unnecessary database calls

## Future Enhancements

- Real-time WebSocket updates
- Advanced filtering and search
- Export functionality for reports
- User activity analytics
- System health monitoring
- Automated alerts and notifications 