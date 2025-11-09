# Quiz App Backend API Documentation

## Server Information
- **Base URL**: http://localhost:3001
- **API Base URL**: http://localhost:3001/api
- **Swagger Documentation**: http://localhost:3001/api/docs

## 🔐 Authorization System Overview

The Quiz App has been updated with a comprehensive role-based authorization system:

### User Roles
1. **Superadmin**: Full system access, can manage all quizzes and user assignments
2. **Admin**: Limited access to assigned quizzes only
3. **User**: Can take published quizzes (requires authentication)
4. **External Participants**: Can only access published quizzes via short URLs (no authentication required)

### Authorization Changes
- **Location-based access** has been replaced with **direct quiz assignments**
- Admins are now assigned to specific quizzes via UserQuizAssignment entities
- Superadmins can access all data and manage quiz assignments
- All quiz endpoints now filter results based on user role and assignments
- **External participants** can access published quizzes via public short URLs without any authentication

### Migration Summary (November 2025)

#### What Changed:
1. **Removed**: `user_locations` table and related endpoints
2. **Added**: `user_quiz_assignments` table with many-to-many User-Quiz relationships  
3. **Updated**: User entity with `superadmin` role
4. **Enhanced**: All quiz endpoints with role-based filtering
5. **New**: User Quiz Assignment management endpoints for superadmins

#### Data Migration:
- Existing admin-location assignments were automatically converted to admin-quiz assignments
- All quizzes in a location are now directly assigned to admins who had access to that location
- No data loss during migration - assignments are preserved but more granular

#### Breaking Changes:
- User Location endpoints (`/api/user-locations/*`) are no longer available
- Quiz endpoints now require authentication and filter by user role
- Admin users can only see quizzes they are specifically assigned to
- Location-based quiz filtering has been replaced with assignment-based filtering

#### New Capabilities:
- Superadmins can assign specific admins to specific quizzes
- More granular access control (admin can access Quiz A but not Quiz B in the same location)
- Better audit trail with assignment tracking
- Scalable for multiple admins per quiz and multiple quizzes per admin
- **Public quiz access** for external participants via short URLs

#### External Participant Access:
- **No Registration Required**: External participants don't need to create accounts
- **No Authentication**: Access quizzes directly via short URLs (tokens)
- **Published Quizzes Only**: Can only access quizzes that are published (`isPublished: true`)
- **Time-based Access**: For scheduled quizzes, access is only available during the scheduled time window
- **Manual Quiz Access**: For manual quizzes, access is available once admin starts the quiz
- **Secure Tokens**: Each quiz has a unique token for secure public access

## 🚀 Standardized Response Format

All API responses follow a consistent structure for better frontend integration and error handling:

### Success Response Structure
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}, // or [] for arrays
  "metadata": {
    "duration": 123,
    "pagination": {}, // for paginated responses
    "total": 50,
    "count": 10
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/users",
  "statusCode": 400
}
```

### Paginated Response Structure
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "pageSize": 10,
      "totalItems": 50,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "metadata": {
    "pagination": {...},
    "total": 50,
    "count": 10,
    "duration": 123
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

## Environment Variables
```env
# Database Configuration
DATABASE_TYPE=pgsql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=12345678
DATABASE_NAME=quiz
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=true

# Application Configuration
APP_PORT=3001
APP_URL=https://quiz.gms.com
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# URLs (for CORS)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001/api

# TinyURL API
TINYURL_API_TOKEN=f5AaG8A2durI2CEOTP8qasCNVIuVvOMoQtp9RT19sLXXYXARE0C1l3VPWOpI

# Scheduler Configuration
SCHEDULER_ENABLED=true
SESSION_CLEANUP_INTERVAL_MINUTES=5
SESSION_CLEANUP_BATCH_SIZE=100

# Security
BCRYPT_ROUNDS=10
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/logout` - User logout

### User Management
- `POST /api/users` - Create user *(superadmin only)*
- `GET /api/users` - Get all users *(superadmin only)*
- `GET /api/users/:id` - Get user by ID *(superadmin/admin)*
- `PUT /api/users/:id` - Update user *(superadmin only)*
- `DELETE /api/users/:id` - Delete user *(superadmin only)*

### User Quiz Assignment Management *(superadmin only)*
- `POST /api/user-quiz-assignments` - Assign admin to quiz
- `GET /api/user-quiz-assignments` - Get all user-quiz assignments
- `GET /api/user-quiz-assignments/user/:userId/quizzes` - Get quizzes assigned to user
- `GET /api/user-quiz-assignments/quiz/:quizId/users` - Get users assigned to quiz
- `DELETE /api/user-quiz-assignments/:id` - Remove user-quiz assignment

### Quiz Management *(role-based filtering)*
- `POST /api/quizzes` - Create quiz *(admin/superadmin)*
- `GET /api/quizzes` - Get quizzes *(filtered by role: superadmin sees all, admin sees assigned only)*
- `GET /api/quizzes/:id` - Get quiz by ID *(role-based access)*
- `PUT /api/quizzes/:id` - Update quiz *(admin/superadmin, must have access)*
- `DELETE /api/quizzes/:id` - Delete quiz *(admin/superadmin, must have access)*
- `GET /api/quizzes/public/:token` - Get published quiz by token *(public access, no authentication required)*
- `GET /api/quizzes/:id/questions` - Get quiz questions
- `GET /api/quizzes/:id/attempts` - Get quiz attempts
- `POST /api/quizzes/:id/duplicate` - Duplicate quiz
- `PUT /api/quizzes/:id/publish` - Publish quiz
- `PUT /api/quizzes/:id/unpublish` - Unpublish quiz
- `POST /api/quizzes/:id/generate-link` - Generate quiz link
- `POST /api/quizzes/:id/start` - Start manual quiz (admin only, for MANUAL type quizzes)
- `GET /api/quizzes/templates` - Get quiz templates for copying (admin only)
- `POST /api/quizzes/:id/copy-template` - Copy existing quiz as new template (admin only)
- `GET /api/quizzes/:id/template-preview` - Preview quiz template details (admin only)

### Question Management
- `POST /api/questions` - Create question
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get question by ID
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `PUT /api/questions/quiz/:quizId/reorder` - Reorder questions

### Attempt Management
- `POST /api/attempts` - Create attempt
- `GET /api/attempts` - Get all attempts
- `GET /api/attempts/:id` - Get attempt by ID
- `PUT /api/attempts/:id` - Update attempt
- `DELETE /api/attempts/:id` - Delete attempt
- `GET /api/attempts/:id/answers` - Get attempt answers
- `GET /api/attempts/quiz/:quizId/export` - Export quiz attempts

### Attempt Answer Management
- `POST /api/attempt-answers` - Create attempt answer
- `GET /api/attempt-answers` - Get all attempt answers
- `GET /api/attempt-answers/attempt/:attemptId` - Get answers by attempt
- `GET /api/attempt-answers/question/:questionId` - Get answers by question
- `GET /api/attempt-answers/question/:questionId/statistics` - Get question statistics
- `GET /api/attempt-answers/:id` - Get attempt answer by ID
- `PATCH /api/attempt-answers/:id` - Update attempt answer
- `DELETE /api/attempt-answers/:id` - Delete attempt answer
- `GET /api/attempt-answers/attempt/:attemptId/correct-count` - Get correct answers count

### Quiz Image Management (Integrated with Quiz Management)
- `POST /api/quizzes/:id/images` - Associate uploaded image with quiz
- Images are loaded automatically when fetching quizzes
- Upload to file server separately, then associate with quiz

### Quiz Scoring Management (Integrated with Quiz Management)  
- `GET /api/quizzes/:id/calculate-score` - Calculate quiz score with templates
- Scoring templates are loaded automatically when fetching quizzes
- Score calculation happens during quiz submission

### Quiz Session Management (NEW)
- `POST /api/quiz-sessions/start` - Start new quiz session
- `POST /api/quiz-sessions/resume` - Resume paused session
- `POST /api/quiz-sessions/:sessionToken/pause` - Pause session
- `POST /api/quiz-sessions/:sessionToken/complete` - Complete session
- `POST /api/quiz-sessions/update-time` - Update session time
- `GET /api/quiz-sessions/token/:sessionToken` - Get session by token
- `GET /api/quiz-sessions/user/:userId/quiz/:quizId` - Get user session for quiz
- `GET /api/quiz-sessions/email/:userEmail/quiz/:quizId` - Get session by email
- `GET /api/quiz-sessions/active` - Get all active sessions (admin)
- `GET /api/quiz-sessions/quiz/:quizId` - Get sessions by quiz (admin)
- `GET /api/quiz-sessions/quiz/:quizId/statistics` - Get quiz session statistics
- `POST /api/quiz-sessions/cleanup-expired` - Manual cleanup expired sessions (admin)

### Configuration Management
- `POST /api/config` - Create config item
- `GET /api/config` - Get all config items
- `GET /api/config/locations` - Get location configs
- `GET /api/config/:id` - Get config by ID
- `PUT /api/config/:id` - Update config
- `DELETE /api/config/:id` - Delete config
- `GET /api/config/group/:group` - Get config by group

### Scheduler Management (NEW)
- `POST /schedule/cleanup/manual` - Manual session cleanup (admin only)
- `POST /schedule/cleanup/emergency` - Emergency session cleanup (admin only)
- `GET /schedule/status` - Get scheduler status (admin only)
- `GET /schedule/stats` - Get cleanup statistics (admin only)

## New Features Added

### 1. Quiz Types & Manual Start
- Added `quizType` enum field to Quiz entity: 'scheduled' | 'manual'
- **SCHEDULED**: Has fixed start and end dates, auto-published when created
- **MANUAL**: Started manually by admin, requires duration but no fixed dates
- New endpoint `POST /api/quizzes/:id/start` for starting manual quizzes
- Automatic validation based on quiz type (dates for scheduled, duration for manual)

### 2. Quiz Duration & Session Management
- Added `durationMinutes` field to Quiz entity
- Created `UserQuizSession` entity for tracking timed sessions
- Session states: ACTIVE, PAUSED, COMPLETED, EXPIRED
- Automatic session expiration based on quiz duration
- Session tokens for secure session identification

### 2. Automated Session Cleanup
- Background scheduler service runs every 5 minutes (configurable)
- Automatically marks expired sessions as EXPIRED
- Environment-controlled scheduler (can be enabled/disabled)
- Batch processing for efficient cleanup
- Manual and emergency cleanup endpoints

### 3. Complete CRUD Operations
- All entities now have full CRUD endpoints
- AttemptAnswer management with statistics
- UserLocation assignment system
- QuizImage upload and management
- Quiz session lifecycle management

## Session Management Flow

## 💻 Frontend Integration Examples

### JavaScript/TypeScript Helpers

```typescript
// Response Type Definitions
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  metadata?: {
    duration?: number;
    pagination?: PaginationMeta;
    total?: number;
    count?: number;
  };
  errors?: ValidationError[];
  timestamp: string;
  statusCode: number;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Quiz Template and Image Interfaces
interface QuizImage {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fullUrl: string; // Auto-generated full URL from file server
  altText?: string;
  isActive: boolean;
}

interface QuizScoring {
  id: number;
  scoringName: string;
  correctAnswerPoints: number;
  incorrectAnswerPenalty: number;
  multiplier: number;
  passingScore?: number;
  isActive: boolean;
}

interface Quiz {
  id: number;
  title: string;
  slug: string;
  token: string;
  quizType: 'scheduled' | 'manual';
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  images?: QuizImage[];
  scoringTemplates?: QuizScoring[];
}

// API Helper Class
class QuizApiClient {
  private baseUrl = 'http://localhost:3001/api';
  private token?: string;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new ApiError(result.message, result.errors, result.statusCode);
    }
    
    return result;
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Users with pagination
  async getUsers(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return this.request<PaginatedResponse<User>>(`/users?${params}`);
  }

  // Quiz operations
  async getQuizzes() {
    return this.request<Quiz[]>('/quizzes');
  }

  async createQuiz(quiz: CreateQuizDto) {
    return this.request<Quiz>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quiz),
    });
  }

  // Template operations
  async getQuizTemplates(serviceType?: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(serviceType && { serviceType }),
    });
    return this.request<PaginatedResponse<Quiz>>(`/quizzes/templates?${params}`);
  }

  async copyQuizTemplate(sourceId: number, copyData: {
    title: string;
    description?: string;
    serviceType?: string;
    locationId?: number;
  }) {
    return this.request<Quiz>(`/quizzes/${sourceId}/copy-template`, {
      method: 'POST',
      body: JSON.stringify(copyData),
    });
  }

  async getTemplatePreview(templateId: number) {
    return this.request<Quiz>(`/quizzes/${templateId}/template-preview`);
  }

  // Manual quiz operations
  async startManualQuiz(quizId: number, startData?: {
    startDateTime?: string;
    durationMinutes?: number;
  }) {
    return this.request<Quiz>(`/quizzes/${quizId}/start`, {
      method: 'POST',
      body: JSON.stringify(startData || {}),
    });
  }
}

// Error handling
class ApiError extends Error {
  constructor(
    message: string,
    public errors?: ValidationError[],
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Usage Examples
const api = new QuizApiClient();

// Login and handle response
try {
  const loginResponse = await api.login('user@example.com', 'password');
  api.setToken(loginResponse.data.access_token);
  
  console.log(loginResponse.message); // "Login successful"
  console.log('User:', loginResponse.data.user);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Login failed:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`${err.field}: ${err.message}`);
      });
    }
  }
}

// Fetch paginated data
try {
  const usersResponse = await api.getUsers(1, 10, 'john');
  const { items, pagination } = usersResponse.data;
  
  console.log(`Found ${pagination.totalItems} users`);
  console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
  console.log('Users:', items);
  
  if (pagination.hasNext) {
    // Load next page
    const nextPage = await api.getUsers(pagination.currentPage + 1);
  }
} catch (error) {
  console.error('Failed to fetch users:', error.message);
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useApiData<T>(fetcher: () => Promise<ApiResponse<T>>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetcher()
      .then(response => {
        setData(response.data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// Template Management Component
const QuizTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Quiz[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Quiz | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const api = new QuizApiClient();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getQuizTemplates('web-development');
      if (response.success) {
        setTemplates(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = async (copyData: {
    title: string;
    description?: string;
    serviceType?: string;
    locationId?: number;
  }) => {
    if (!selectedTemplate) return;

    try {
      const response = await api.copyQuizTemplate(selectedTemplate.id, copyData);
      if (response.success) {
        alert('Template copied successfully!');
        setCopyDialogOpen(false);
        setSelectedTemplate(null);
        // Optionally redirect to edit the new quiz
        window.location.href = `/quizzes/${response.data.id}/edit`;
      }
    } catch (error) {
      console.error('Failed to copy template:', error);
      alert('Failed to copy template');
    }
  };

  const previewTemplate = async (template: Quiz) => {
    try {
      const response = await api.getTemplatePreview(template.id);
      if (response.success) {
        console.log('Template preview:', response.data);
        // Show preview modal or navigate to preview page
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  return (
    <div className="template-manager">
      <h2>Quiz Templates</h2>
      
      {loading ? (
        <div>Loading templates...</div>
      ) : (
        <div className="template-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <h3>{template.title}</h3>
              <p>{template.description}</p>
              
              {/* Display template images */}
              {template.images && template.images.length > 0 && (
                <div className="template-images">
                  {template.images.map(image => (
                    <img
                      key={image.id}
                      src={image.fullUrl} // Use auto-generated full URL
                      alt={image.altText || template.title}
                      className="template-thumbnail"
                      onError={(e) => {
                        // Handle broken image URLs
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Template statistics */}
              <div className="template-stats">
                <span>Questions: {template.questions?.length || 0}</span>
                <span>Scoring Rules: {template.scoringTemplates?.length || 0}</span>
                <span>Images: {template.images?.length || 0}</span>
              </div>

              <div className="template-actions">
                <button onClick={() => previewTemplate(template)}>
                  Preview
                </button>
                <button 
                  onClick={() => {
                    setSelectedTemplate(template);
                    setCopyDialogOpen(true);
                  }}
                  className="copy-btn"
                >
                  Copy Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copy Dialog */}
      {copyDialogOpen && selectedTemplate && (
        <CopyTemplateDialog
          template={selectedTemplate}
          onCopy={handleCopyTemplate}
          onCancel={() => {
            setCopyDialogOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// Copy Template Dialog Component
const CopyTemplateDialog: React.FC<{
  template: Quiz;
  onCopy: (data: any) => void;
  onCancel: () => void;
}> = ({ template, onCopy, onCancel }) => {
  const [formData, setFormData] = useState({
    title: `Copy of ${template.title}`,
    description: template.description || '',
    serviceType: 'web-development',
    locationId: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCopy(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Copy Template: {template.title}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Quiz Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Service Type:</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
            >
              <option value="web-development">Web Development</option>
              <option value="mobile-development">Mobile Development</option>
              <option value="data-science">Data Science</option>
              {/* Add more options */}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">Copy Template</button>
          </div>
        </form>

        <div className="copy-note">
          <p><strong>Note:</strong> Questions and scoring rules will be copied. Images will reference the same files on the external file server.</p>
        </div>
      </div>
    </div>
  );
};

### External File Server Integration

```typescript
// File Upload Service for External Server
class FileUploadService {
  private fileServerUrl = process.env.REACT_APP_FILE_SERVER_URL || 'http://localhost:8080';

  async uploadImage(file: File): Promise<{
    success: boolean;
    fileName: string;
    filePath: string;
    fullUrl: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.fileServerUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    
    return {
      success: true,
      fileName: result.fileName,
      filePath: result.path,
      fullUrl: `${this.fileServerUrl}/${result.path}`,
    };
  }

  async deleteImage(filePath: string): Promise<boolean> {
    const response = await fetch(`${this.fileServerUrl}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    return response.ok;
  }
}

// Quiz Image Manager Component
const QuizImageManager: React.FC<{
  quizId: number;
  onImageAdded: (image: QuizImage) => void;
}> = ({ quizId, onImageAdded }) => {
  const [uploading, setUploading] = useState(false);
  const fileUploadService = new FileUploadService();
  const api = new QuizApiClient();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Step 1: Upload to external file server
      const uploadResult = await fileUploadService.uploadImage(file);
      
      // Step 2: Create quiz image record in our database
      const imageData = {
        quizId: quizId,
        fileName: uploadResult.fileName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        filePath: uploadResult.filePath,
        altText: `Image for quiz ${quizId}`,
      };

      // Note: This would require a new endpoint in quiz controller
      const response = await api.createQuizImage(quizId, imageData);
      
      if (response.success) {
        onImageAdded({
          ...response.data,
          fullUrl: uploadResult.fullUrl,
        });
        
        // Reset file input
        event.target.value = '';
      }

    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-section">
      <h3>Quiz Images</h3>
      
      <div className="upload-area">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          id="image-upload"
        />
        <label htmlFor="image-upload" className={`upload-btn ${uploading ? 'uploading' : ''}`}>
          {uploading ? 'Uploading...' : 'Select Image'}
        </label>
      </div>

      <div className="upload-info">
        <p>• Supported formats: JPG, PNG, GIF, WEBP</p>
        <p>• Maximum size: 5MB</p>
        <p>• Images are stored on external file server</p>
      </div>
    </div>
  );
};

// Quiz Type Manager Component for handling scheduled vs manual quizzes
const QuizTypeManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const api = new QuizApiClient();

  const loadQuizzes = async () => {
    const response = await api.getQuizzes();
    if (response.success) {
      setQuizzes(response.data.items || response.data);
    }
  };

  const startManualQuiz = async (quiz: Quiz, startData?: {
    startDateTime?: string;
    durationMinutes?: number;
  }) => {
    try {
      const response = await api.startManualQuiz(quiz.id, startData);
      if (response.success) {
        alert(`Quiz "${quiz.title}" started successfully!`);
        setStartDialogOpen(false);
        setSelectedQuiz(null);
        loadQuizzes(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('Failed to start quiz');
    }
  };

  return (
    <div className="quiz-type-manager">
      <h2>Quiz Management</h2>
      
      <div className="quiz-list">
        {quizzes.map(quiz => (
          <div key={quiz.id} className={`quiz-card ${quiz.quizType}`}>
            <div className="quiz-header">
              <h3>{quiz.title}</h3>
              <span className={`quiz-type-badge ${quiz.quizType}`}>
                {quiz.quizType.toUpperCase()}
              </span>
            </div>

            <div className="quiz-details">
              {quiz.quizType === 'scheduled' ? (
                <div className="scheduled-info">
                  <p><strong>Start:</strong> {new Date(quiz.startDateTime).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(quiz.endDateTime).toLocaleString()}</p>
                  <p><strong>Duration:</strong> {quiz.durationMinutes} minutes</p>
                  <p><strong>Status:</strong> 
                    {quiz.isPublished ? (
                      <span className="status published">Published & Active</span>
                    ) : (
                      <span className="status draft">Draft</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="manual-info">
                  <p><strong>Duration:</strong> {quiz.durationMinutes} minutes</p>
                  <p><strong>Status:</strong> 
                    {quiz.isPublished ? (
                      <span className="status running">Running</span>
                    ) : quiz.startDateTime ? (
                      <span className="status ready">Ready to Start</span>
                    ) : (
                      <span className="status draft">Not Started</span>
                    )}
                  </p>
                  {quiz.startDateTime && (
                    <>
                      <p><strong>Started:</strong> {new Date(quiz.startDateTime).toLocaleString()}</p>
                      <p><strong>Ends:</strong> {new Date(quiz.endDateTime).toLocaleString()}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="quiz-actions">
              {quiz.quizType === 'manual' && !quiz.isPublished && (
                <button 
                  onClick={() => {
                    setSelectedQuiz(quiz);
                    setStartDialogOpen(true);
                  }}
                  className="start-quiz-btn"
                >
                  Start Quiz
                </button>
              )}
              
              {quiz.quizType === 'scheduled' && (
                <button disabled>
                  Auto-scheduled
                </button>
              )}
              
              <button onClick={() => window.open(`/quiz/${quiz.token}`)}>
                View Quiz
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Start Manual Quiz Dialog */}
      {startDialogOpen && selectedQuiz && (
        <StartQuizDialog
          quiz={selectedQuiz}
          onStart={startManualQuiz}
          onCancel={() => {
            setStartDialogOpen(false);
            setSelectedQuiz(null);
          }}
        />
      )}
    </div>
  );
};
```

### User Quiz Assignment Management Components

```typescript
import React, { useState, useEffect } from 'react';

// User Quiz Assignment Manager (Superadmin Only)
const UserQuizAssignmentManager: React.FC = () => {
  const [assignments, setAssignments] = useState<UserQuizAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const api = new ApiClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, usersRes, quizzesRes] = await Promise.all([
        api.get('/user-quiz-assignments'),
        api.get('/users'),
        api.get('/quizzes')
      ]);

      if (assignmentsRes.success) setAssignments(assignmentsRes.data.items);
      if (usersRes.success) setUsers(usersRes.data.items.filter(u => u.role === 'admin'));
      if (quizzesRes.success) setQuizzes(quizzesRes.data.items || quizzesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!selectedUser || !selectedQuiz) return;

    try {
      const response = await api.post('/user-quiz-assignments', {
        userId: selectedUser,
        quizId: selectedQuiz,
        isActive: true
      });

      if (response.success) {
        setAssignments([...assignments, response.data]);
        setSelectedUser(null);
        setSelectedQuiz(null);
        alert('Assignment created successfully');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const removeAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const response = await api.delete(`/user-quiz-assignments/${assignmentId}`);
      
      if (response.success) {
        setAssignments(assignments.filter(a => a.id !== assignmentId));
        alert('Assignment removed successfully');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const getUserAssignedQuizzes = async (userId: number) => {
    try {
      const response = await api.get(`/user-quiz-assignments/user/${userId}/quizzes`);
      if (response.success) {
        console.log(`User ${userId} assigned quizzes:`, response.data.items);
      }
    } catch (error) {
      console.error('Error fetching user quizzes:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="assignment-manager">
      <h2>User Quiz Assignment Management</h2>
      
      {/* Create New Assignment */}
      <div className="create-assignment">
        <h3>Create New Assignment</h3>
        <div className="form-row">
          <select 
            value={selectedUser || ''} 
            onChange={(e) => setSelectedUser(Number(e.target.value))}
          >
            <option value="">Select Admin User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          
          <select 
            value={selectedQuiz || ''} 
            onChange={(e) => setSelectedQuiz(Number(e.target.value))}
          >
            <option value="">Select Quiz</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title} ({quiz.serviceType})
              </option>
            ))}
          </select>
          
          <button 
            onClick={createAssignment}
            disabled={!selectedUser || !selectedQuiz}
          >
            Create Assignment
          </button>
        </div>
      </div>

      {/* Existing Assignments */}
      <div className="assignments-list">
        <h3>Current Assignments ({assignments.length})</h3>
        {assignments.length === 0 ? (
          <p>No assignments found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Admin User</th>
                <th>Quiz</th>
                <th>Service Type</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id}>
                  <td>
                    <div>
                      <strong>{assignment.user?.name}</strong>
                      <br />
                      <small>{assignment.user?.email}</small>
                    </div>
                  </td>
                  <td>{assignment.quiz?.title}</td>
                  <td>{assignment.quiz?.serviceType}</td>
                  <td>{new Date(assignment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${assignment.isActive ? 'active' : 'inactive'}`}>
                      {assignment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => getUserAssignedQuizzes(assignment.userId)}
                      className="view-btn"
                    >
                      View All
                    </button>
                    <button 
                      onClick={() => removeAssignment(assignment.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Role-based Quiz List Component
const RoleBasedQuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const api = new ApiClient();

  useEffect(() => {
    loadQuizzesForCurrentUser();
  }, []);

  const loadQuizzesForCurrentUser = async () => {
    try {
      // Get current user from auth context or token
      const userResponse = await api.get('/auth/profile');
      if (userResponse.success) {
        setUser(userResponse.data);
      }

      // Fetch quizzes (automatically filtered by backend based on user role)
      const quizzesResponse = await api.get('/quizzes');
      if (quizzesResponse.success) {
        setQuizzes(quizzesResponse.data.items || quizzesResponse.data);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleMessage = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'Viewing all quizzes (Superadmin access)';
      case 'admin':
        return 'Viewing assigned quizzes only (Admin access)';
      case 'user':
        return 'Viewing published quizzes (User access)';
      default:
        return 'Loading...';
    }
  };

  if (loading) return <div className="loading">Loading quizzes...</div>;

  return (
    <div className="role-based-quiz-list">
      <div className="header">
        <h2>Quiz Dashboard</h2>
        <p className="role-info">{getRoleMessage()}</p>
        <div className="user-info">
          Logged in as: <strong>{user?.name}</strong> ({user?.role})
        </div>
      </div>

      <div className="quizzes-grid">
        {quizzes.length === 0 ? (
          <div className="no-quizzes">
            {user?.role === 'admin' 
              ? 'No quizzes assigned to you' 
              : 'No quizzes available'
            }
          </div>
        ) : (
          quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <h3>{quiz.title}</h3>
              <p>{quiz.description}</p>
              <div className="quiz-meta">
                <span className="service-type">{quiz.serviceType}</span>
                <span className="quiz-type">{quiz.quizType}</span>
                <span className={`status ${quiz.isPublished ? 'published' : 'draft'}`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="quiz-actions">
                {user?.role !== 'user' && (
                  <button onClick={() => window.open(`/admin/quiz/${quiz.id}`)}>
                    Manage
                  </button>
                )}
                
                {quiz.isPublished && (
                  <button onClick={() => window.open(`/quiz/${quiz.token}`)}>
                    Take Quiz
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Public Quiz Access Component (for External Participants)
const PublicQuizAccess: React.FC<{ token: string }> = ({ token }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicQuiz();
  }, [token]);

  const loadPublicQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // Public API call - no authentication required
      const response = await fetch(`/api/quizzes/public/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setQuiz(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error loading public quiz:', error);
      setError('Unable to load quiz. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Quiz Access Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={loadPublicQuiz}>Try Again</button>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="not-found">
        <h2>Quiz Not Found</h2>
        <p>The quiz you're looking for is not available or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="public-quiz-container">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <p className="quiz-description">{quiz.description}</p>
        
        <div className="quiz-info">
          <div className="info-item">
            <strong>Duration:</strong> {quiz.durationMinutes} minutes
          </div>
          <div className="info-item">
            <strong>Questions:</strong> {quiz.questions?.length || 0}
          </div>
          <div className="info-item">
            <strong>Passing Score:</strong> {quiz.passingScore}%
          </div>
          
          {quiz.quizType === 'scheduled' && quiz.startDateTime && quiz.endDateTime && (
            <>
              <div className="info-item">
                <strong>Available:</strong> {new Date(quiz.startDateTime).toLocaleString()} - {new Date(quiz.endDateTime).toLocaleString()}
              </div>
            </>
          )}
        </div>

        {quiz.images && quiz.images.length > 0 && (
          <div className="quiz-images">
            {quiz.images.map(image => (
              <img
                key={image.id}
                src={image.fullUrl}
                alt={image.altText || quiz.title}
                className="quiz-banner"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="quiz-actions">
        <button 
          className="start-quiz-btn primary"
          onClick={() => {
            // Start quiz session for external participant
            window.location.href = `/quiz/take/${quiz.token}`;
          }}
        >
          Start Quiz
        </button>
        
        <div className="quiz-notice">
          <p>⚠️ <strong>Note:</strong> You don't need to register or login to take this quiz.</p>
          <p>📝 Your progress will be tracked by your session. Make sure to complete the quiz in one session.</p>
        </div>
      </div>
    </div>
  );
};

// Usage example for public quiz page
// URL: /quiz/{token}
const PublicQuizPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="error-container">
        <h2>Invalid Quiz Link</h2>
        <p>The quiz link appears to be invalid or incomplete.</p>
      </div>
    );
  }

  return <PublicQuizAccess token={token} />;
};

// Authorization Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode token or fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const api = new ApiClient();
      const response = await api.get('/auth/profile');
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  const canAccessAllQuizzes = () => {
    return user?.role === 'superadmin';
  };

  const canManageAssignments = () => {
    return user?.role === 'superadmin';
  };

  return {
    user,
    loading,
    hasRole,
    canAccessAllQuizzes,
    canManageAssignments,
    isSuperadmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user'
  };
};
```

### Environment Configuration

```bash
# .env file for React frontend
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_FILE_SERVER_URL=http://localhost:8080

# .env file for NestJS backend  
FILE_SERVER_URL=http://localhost:8080
DATABASE_URL=postgresql://username:password@localhost:5432/quiz_db
JWT_SECRET=your-secret-key-change-in-production
```

// Component usage
function UsersList() {
  const { data: usersResponse, loading, error } = useApiData(() => 
    api.getUsers(1, 10)
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!usersResponse) return <div>No data</div>;

  const { items: users, pagination } = usersResponse;

  return (
    <div>
      <h2>Users ({pagination.totalItems} total)</h2>
      {users.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
      
      <div>
        Page {pagination.currentPage} of {pagination.totalPages}
        {pagination.hasNext && <button>Next Page</button>}
        {pagination.hasPrevious && <button>Previous Page</button>}
      </div>
    </div>
  );
}
```

#### Start Manual Quiz
```json
POST /api/quizzes/5/start
{
  "startDateTime": "2025-11-10T14:00:00.000Z",
  "durationMinutes": 90
}

Response:
{
  "success": true,
  "message": "Manual quiz started successfully",
  "data": {
    "id": 5,
    "title": "JavaScript Assessment",
    "quizType": "manual",
    "startDateTime": "2025-11-10T14:00:00.000Z",
    "endDateTime": "2025-11-10T15:30:00.000Z",
    "durationMinutes": 90,
    "isPublished": true,
    "token": "JS_TEST_2024"
  },
  "statusCode": 200
}
```

### Starting a Quiz Session
```json
POST /api/quiz-sessions/start
{
  "quizId": 1,
  "userEmail": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Quiz session started successfully",
  "data": {
    "sessionToken": "uuid-token",
    "expiresAt": "2025-11-09T20:02:53.000Z",
    "sessionStatus": "ACTIVE"
  },
  "metadata": {
    "duration": 45
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 201
}
```

## 📋 Complete API Response Examples

### Authentication Responses

#### Login Success
```json
POST /api/auth/login
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "name": "Super Administrator",
      "email": "superadmin@gms.com",
      "role": "superadmin"
    }
  },
  "metadata": {
    "duration": 234
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

#### Login Error
```json
{
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/auth/login",
  "statusCode": 401
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 6 characters"
    }
  ],
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/auth/register",
  "statusCode": 400
}
```

### User Management Responses

#### Get All Users (Paginated)
```json
GET /api/users?page=1&limit=10&search=john
{
  "success": true,
  "message": "Found 3 users matching \"john\"",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@gms.com",
        "role": "user",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "location": {
          "id": 1,
          "key": "jakarta_pusat",
          "value": "Jakarta Pusat"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "pageSize": 10,
      "totalItems": 3,
      "hasNext": false,
      "hasPrevious": false
    }
  },
  "metadata": {
    "pagination": {...},
    "total": 3,
    "count": 3,
    "duration": 45
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

#### Get Single User
```json
GET /api/users/1
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@gms.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "location": {
      "id": 1,
      "key": "jakarta_pusat",
      "value": "Jakarta Pusat"
    }
  },
  "metadata": {
    "duration": 23
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

#### User Not Found
```json
GET /api/users/999
{
  "success": false,
  "message": "User not found",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/users/999",
  "statusCode": 404
}
```

### Quiz Management Responses

#### Get All Quizzes (Role-Based Filtering)
```json
GET /api/quizzes
// Note: Results are filtered by user role:
// - Superadmin: sees all quizzes
// - Admin: sees only assigned quizzes
// - User: sees only published quizzes
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Test Masuk Service Management Batch 1",
      "description": "Test untuk seleksi masuk tim Service Management",
      "slug": "test-sm-batch-1",
      "token": "sm-batch-1-2024",
      "serviceType": "service-management",
      "isPublished": true,
      "passingScore": 70,
      "questionsPerPage": 5,
      "durationMinutes": 120,
      "startDateTime": "2024-08-01T08:00:00.000Z",
      "endDateTime": "2025-08-30T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "metadata": {
    "count": 2,
    "duration": 78
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

#### Create Scheduled Quiz Success
```json
POST /api/quizzes
{
  "title": "JavaScript Midterm Exam",
  "description": "Comprehensive JavaScript test",
  "serviceType": "web-development",
  "quizType": "scheduled",
  "startDateTime": "2025-01-15T08:00:00.000Z",
  "endDateTime": "2025-01-15T10:00:00.000Z",
  "durationMinutes": 120,
  "passingScore": 75
}

Response:
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": 3,
    "title": "JavaScript Midterm Exam",
    "slug": "javascript-midterm-exam",
    "token": "JS_MIDTERM_2025",
    "quizType": "scheduled",
    "startDateTime": "2025-01-15T08:00:00.000Z",
    "endDateTime": "2025-01-15T10:00:00.000Z",
    "durationMinutes": 120,
    "isPublished": true,
    "createdAt": "2025-11-10T10:30:00.000Z"
  },
  "statusCode": 201
}
```

#### Create Manual Quiz Success
```json
POST /api/quizzes
{
  "title": "React Skills Assessment",
  "description": "On-demand React knowledge test",
  "serviceType": "web-development",
  "quizType": "manual",
  "durationMinutes": 60,
  "passingScore": 80
}

Response:
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": 4,
    "title": "React Skills Assessment",
    "slug": "react-skills-assessment",
    "token": "REACT_SKILLS_2025",
    "quizType": "manual",
    "startDateTime": null,
    "endDateTime": null,
    "durationMinutes": 60,
    "isPublished": false,
    "createdAt": "2025-11-10T10:30:00.000Z"
  },
  "statusCode": 201
}
```

#### Get Quiz Templates
```json
GET /api/quizzes/templates?page=1&limit=5&serviceType=web-development
{
  "success": true,
  "message": "Quiz templates retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals Template",
        "description": "Comprehensive JS knowledge test",
        "serviceType": "web-development",
        "passingScore": 70,
        "durationMinutes": 120,
        "questions": [...],
        "scoringTemplates": [...],
        "images": [...]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "pageSize": 5,
      "totalItems": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "statusCode": 200
}
```

#### Copy Quiz Template
```json
POST /api/quizzes/1/copy-template
{
  "title": "JavaScript Test Batch 2024",
  "description": "Updated JS test for 2024 batch",
  "serviceType": "web-development",
  "locationId": 1
}

Response:
{
  "success": true,
  "message": "Quiz template copied successfully",
  "data": {
    "id": 15,
    "title": "JavaScript Test Batch 2024",
    "slug": "javascript-test-batch-2024",
    "token": "JS2024ABC123",
    "isPublished": false,
    "questions": [...], // Copied from source
    "scoringTemplates": [...], // Copied from source
    "images": [] // Need manual re-upload to file server
  },
  "statusCode": 201
}
```

#### Template Preview
```json
GET /api/quizzes/1/template-preview
{
  "success": true,
  "message": "Quiz template preview retrieved successfully",
  "data": {
    "id": 1,
    "title": "JavaScript Fundamentals",
    "description": "Complete JS assessment",
    "questions": [...],
    "scoringTemplates": [...],
    "images": [...],
    "statistics": {
      "totalQuestions": 25,
      "totalImages": 3,
      "scoringRulesCount": 4,
      "hasTimeLimit": true
    }
  },
  "statusCode": 200
}
```

#### Public Quiz Access (External Participants)
```json
GET /api/quizzes/public/JS_QUIZ_2024_TOKEN
// No authentication required - public access via token
{
  "success": true,
  "message": "Quiz retrieved successfully",
  "data": {
    "id": 1,
    "title": "JavaScript Fundamentals Quiz",
    "description": "Test your JavaScript knowledge",
    "token": "JS_QUIZ_2024_TOKEN",
    "serviceType": "web-development",
    "quizType": "scheduled",
    "startDateTime": "2025-11-10T09:00:00.000Z",
    "endDateTime": "2025-11-10T17:00:00.000Z",
    "durationMinutes": 120,
    "passingScore": 70,
    "questionsPerPage": 5,
    "isActive": true,
    "isPublished": true,
    "questions": [
      {
        "id": 1,
        "questionText": "What is a closure in JavaScript?",
        "questionType": "multiple-choice",
        "options": [
          "A function inside another function",
          "A way to close the browser",
          "A variable declaration",
          "None of the above"
        ],
        "correctAnswer": "A function inside another function",
        "points": 10
      }
    ],
    "images": [
      {
        "id": 1,
        "fileName": "js-concepts.png",
        "fullUrl": "http://localhost:8080/uploads/quiz-images/js-concepts.png",
        "altText": "JavaScript concepts diagram"
      }
    ],
    "scoringTemplates": [
      {
        "id": 1,
        "scoringName": "Standard Scoring",
        "correctAnswerPoints": 10,
        "incorrectAnswerPenalty": 0,
        "multiplier": 1.0
      }
    ]
  },
  "metadata": {
    "duration": 45
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

#### Public Quiz Access - Quiz Not Published
```json
GET /api/quizzes/public/DRAFT_QUIZ_TOKEN
{
  "success": false,
  "message": "Quiz not found or not published for public access",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/quizzes/public/DRAFT_QUIZ_TOKEN",
  "statusCode": 404
}
```

#### Public Quiz Access - Quiz Not Started Yet
```json
GET /api/quizzes/public/FUTURE_QUIZ_TOKEN
{
  "success": false,
  "message": "Quiz has not started yet",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/quizzes/public/FUTURE_QUIZ_TOKEN",
  "statusCode": 400
}
```

#### Public Quiz Access - Quiz Already Ended
```json
GET /api/quizzes/public/EXPIRED_QUIZ_TOKEN
{
  "success": false,
  "message": "Quiz has already ended",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/quizzes/public/EXPIRED_QUIZ_TOKEN",
  "statusCode": 400
}
```

### Resuming/Checking Session
```json
GET /api/quiz-sessions/token/{sessionToken}
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "id": 1,
    "sessionToken": "uuid-token",
    "sessionStatus": "ACTIVE",
    "timeSpentSeconds": 120,
    "remainingTimeSeconds": 180,
    "isExpired": false
  },
  "metadata": {
    "duration": 12
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

### Pausing Session
```json
POST /api/quiz-sessions/{sessionToken}/pause
{
  "success": true,
  "message": "Session paused successfully",
  "data": null,
  "metadata": {
    "duration": 34
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

### Completing Session
```json
POST /api/quiz-sessions/{sessionToken}/complete
{
  "success": true,
  "message": "Session completed successfully",
  "data": {
    "finalScore": 85,
    "passed": true,
    "completedAt": "2025-11-10T10:30:00.000Z"
  },
  "metadata": {
    "duration": 67
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "statusCode": 200
}
```

## 🖼️ File Server Integration

### Image Upload Flow
1. **Frontend uploads image to file server** (e.g., `http://localhost:8080`)
2. **File server returns image URL** (e.g., `http://localhost:8080/uploads/quiz-images/image123.jpg`)
3. **Frontend calls quiz API** with the returned image URL:
   ```json
   POST /api/quizzes/1/images
   {
     "imageUrl": "http://localhost:8080/uploads/quiz-images/image123.jpg",
     "altText": "Quiz banner image",
     "order": 1
   }
   ```
4. **Quiz API associates image with quiz** and returns updated quiz data

### Environment Configuration
```env
FILE_SERVER_URL=http://localhost:8080
```

### Quiz Images in Response
When fetching quizzes, images are included automatically:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "JavaScript Quiz",
    "images": [
      {
        "id": 1,
        "imageUrl": "http://localhost:8080/uploads/quiz-images/banner.jpg",
        "altText": "Quiz banner",
        "order": 1
      }
    ],
    "scoringTemplates": [
      {
        "id": 1,
        "minScore": 90,
        "maxScore": 100,
        "grade": "A",
        "description": "Excellent"
      }
    ]
  }
}
```

## 🎯 Frontend Development Guide

### Status Code Reference
- **200** - Success (GET, PUT, PATCH operations)
- **201** - Created (POST operations)  
- **204** - No Content (DELETE operations)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (duplicate entries)
- **422** - Unprocessable Entity (business logic errors)
- **500** - Internal Server Error

### Best Practices for Frontend Integration

#### 1. Always Check the `success` Field
```typescript
const handleApiResponse = async (apiCall: Promise<ApiResponse<any>>) => {
  try {
    const response = await apiCall;
    if (response.success) {
      // Handle success
      console.log(response.message);
      return response.data;
    }
  } catch (error) {
    // Handle error (network issues, server errors)
    console.error('API Error:', error);
  }
};
```

#### 2. Handle Validation Errors Gracefully
```typescript
const handleFormSubmit = async (formData: any) => {
  try {
    const response = await api.createUser(formData);
    if (response.success) {
      showSuccessMessage(response.message);
      return response.data;
    }
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      // Display field-specific errors
      error.errors.forEach(err => {
        showFieldError(err.field, err.message);
      });
    } else {
      showGeneralError(error.message);
    }
  }
};
```

#### 3. Implement Proper Pagination
```typescript
const PaginatedList = ({ endpoint, ItemComponent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(null);
  
  const loadPage = async (page: number) => {
    const response = await api.request(`${endpoint}?page=${page}&limit=10`);
    if (response.success) {
      setData(response.data);
      setCurrentPage(page);
    }
  };
  
  if (!data) return <div>Loading...</div>;
  
  const { items, pagination } = data;
  
  return (
    <div>
      {items.map(item => <ItemComponent key={item.id} item={item} />)}
      
      <div className="pagination">
        <button 
          disabled={!pagination.hasPrevious}
          onClick={() => loadPage(pagination.currentPage - 1)}
        >
          Previous
        </button>
        
        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
        
        <button 
          disabled={!pagination.hasNext}
          onClick={() => loadPage(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
      
      <small>Showing {items.length} of {pagination.totalItems} items</small>
    </div>
  );
};
```

#### 4. Use Response Metadata
```typescript
const performOperation = async () => {
  const startTime = Date.now();
  const response = await api.someOperation();
  
  if (response.success) {
    console.log(`Operation completed in ${response.metadata?.duration}ms`);
    
    // Show performance info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Client-to-server round trip:', Date.now() - startTime, 'ms');
      console.log('Server processing time:', response.metadata?.duration, 'ms');
    }
  }
};
```

## Scheduler Configuration

The scheduler service automatically cleans up expired sessions based on these environment variables:

- `SCHEDULER_ENABLED=true` - Enable/disable scheduler
- `SESSION_CLEANUP_INTERVAL_MINUTES=5` - Cleanup interval (default: 5 minutes)  
- `SESSION_CLEANUP_BATCH_SIZE=100` - Max sessions to process per cleanup (default: 100)

## Database Schema Updates

### New UserQuizSession Table
```sql
CREATE TYPE session_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED');

CREATE TABLE user_quiz_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR UNIQUE NOT NULL,
  quiz_id INTEGER NOT NULL,
  user_id INTEGER,
  user_email VARCHAR NOT NULL,
  session_status session_status DEFAULT 'ACTIVE',
  started_at TIMESTAMP DEFAULT NOW(),
  paused_at TIMESTAMP,
  resumed_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Updated Quiz Table
```sql
ALTER TABLE quiz ADD COLUMN duration_minutes INTEGER;
```

## Usage Examples

### Frontend Integration
```javascript
// Start a quiz session
const response = await fetch('/api/quiz-sessions/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quizId: 1,
    userEmail: 'user@example.com'
  })
});

const session = await response.json();
localStorage.setItem('sessionToken', session.data.sessionToken);

// Check session status periodically
setInterval(async () => {
  const token = localStorage.getItem('sessionToken');
  const response = await fetch(`/api/quiz-sessions/token/${token}`);
  const session = await response.json();
  
  if (session.data.isExpired) {
    alert('Quiz session has expired!');
    // Redirect or handle expiration
  }
}, 30000); // Check every 30 seconds
```

## Server Status
✅ All endpoints successfully mapped and running
✅ Scheduler service initialized and active
✅ Database connections established
✅ Authentication system ready
✅ Session management operational
✅ Automatic cleanup running every 5 minutes