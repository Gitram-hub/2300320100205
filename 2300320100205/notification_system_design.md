# Notification System Design

## Stage 1: REST APIs

### Problem Understanding
The campus app needs to send notifications for placements, events, and results. Students should be able to view them, mark them as read, and see how many are still unread.

### Proposed Solution
I would keep the API simple and use JSON over HTTP.

#### Endpoints
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/notifications/unread-count`
- `POST /api/v1/notifications`
- `GET /api/v1/notifications/stream` for live updates

#### Sample Requests
```http
GET /api/v1/notifications?studentId=1042&limit=10&offset=0
Authorization: Bearer <token>
```

```json
{
  "studentId": 1042,
  "notifications": [
    {
      "id": 501,
      "type": "Placement",
      "title": "Interview shortlist released",
      "message": "Your shortlist is now available.",
      "isRead": false
    }
  ]
}
```

#### Mark as Read
```http
PATCH /api/v1/notifications/501/read
Authorization: Bearer <token>
```

```json
{ "studentId": 1042 }
```

#### Unread Count
```json
{ "studentId": 1042, "unreadCount": 7 }
```

### Justification
REST is easy to build and test. For real-time updates, WebSockets or SSE would work better than repeated refreshes.

## Stage 2: Database

### Choice
I would use **PostgreSQL** because notifications are structured and the queries are straightforward.

### Simple Schema
- `students(id, name, email, department)`
- `notifications(id, student_id, notification_type, title, message, is_read, created_at)`

### Sample Queries
```sql
SELECT id, notification_type, title, message, is_read, created_at
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

```sql
UPDATE notifications
SET is_read = true
WHERE id = 501 AND student_id = 1042;
```

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = 1042 AND is_read = false;
```

### Scalability Notes
As data grows, the main issues are slow unread-count queries, heavy `OFFSET` pagination, and a large notifications table.

### Fixes
- add indexes on `student_id`, `is_read`, and `created_at`
- use keyset pagination for deeper pages
- cache unread counts
- move old notifications to an archive table

## Stage 3: Query Analysis

### Given Query
```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Analysis
The logic is fine, but the real column names should be consistent, like `student_id`, `is_read`, and `created_at`.

### Why It Gets Slow
With 50,000 students and 5,000,000 notifications, the database may scan a lot of rows and sort them if indexes are missing.

### Better Index
```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

### Why Not Index Everything
Too many indexes slow down inserts and updates and also use extra storage.

### Placement Notifications in Last 7 Days
```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days';
```

## Stage 4: Frequent Fetching

Fetching notifications on every page load can put extra load on the backend and database.

### Better Options
- caching for recent notifications
- pagination for smaller responses
- WebSockets for live updates
- read replicas for read-heavy traffic

### Tradeoffs
- caching can be slightly stale
- WebSockets are faster but more complex
- polling is simple but wasteful

## Stage 5: Reliability of Notification Sending

### Problem
The loop sends email, saves to DB, and pushes to the app one by one. If one step fails, the whole process can become inconsistent.

### Better Approach
Save the notification first, then send delivery jobs to a queue. Workers can handle email and app push separately.

### Improved Pseudocode
```text
function notify_all(student_ids, message):
    notification_id = save_notification_event(message)
    for student_id in student_ids:
        enqueue_job(student_id, notification_id, message)

worker(job):
    try:
        send_email(job.student_id, job.message)
        push_to_app(job.student_id, job.message)
        mark_success(job)
    except error:
        retry_later(job)
```

### Note
Database write and email sending should not happen tightly together. The database record should be saved first, then delivery can happen in the background.

## Stage 6: Priority Inbox

Unread notifications should be ranked by type and recency. Placement should come first, then Result, then Event.

### JavaScript Code
```javascript
function getWeight(type) {
    if (type === 'Placement') return 3;
    if (type === 'Result') return 2;
    return 1;
}

function getTopNotifications(notifications, topN = 10) {
    return notifications
        .filter((item) => !item.isRead)
        .sort((a, b) => {
            const scoreA = getWeight(a.notificationType) * 1000000000 + new Date(a.createdAt).getTime();
            const scoreB = getWeight(b.notificationType) * 1000000000 + new Date(b.createdAt).getTime();
            return scoreB - scoreA;
        })
        .slice(0, topN);
}

module.exports = { getTopNotifications };
```

### Complexity
Sorting takes `O(n log n)`. If notifications keep coming in continuously, a small heap would be better for keeping only the top 10.
