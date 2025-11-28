# isActive Field Update Support

## Updated Services to Support isActive in Edit Operations

### 1. User Service ✅
- **DTO**: `UpdateUserDto` now includes `isActive?: boolean`
- **Service**: `UserService.update()` automatically handles the field
- **API**: `PUT /api/users/:id` can now accept `isActive` in request body

**Example Request:**
```json
PUT /api/users/1
{
  "name": "John Doe",
  "isActive": false
}
```

### 2. Quiz Service ✅
- **DTO**: `UpdateQuizDto` already has `isActive?: boolean` 
- **Service**: `QuizService.update()` handles the field
- **API**: `PUT /api/quizzes/:id` can accept `isActive` in request body

**Example Request:**
```json
PUT /api/quizzes/1
{
  "title": "Updated Quiz",
  "isActive": false
}
```

### 3. Config Service ✅
- **DTO**: `UpdateConfigItemDto` already has `isActive?: boolean`
- **Service**: `ConfigService.update()` handles the field  
- **API**: `PUT /api/config/:id` can accept `isActive` in request body

**Example Request:**
```json
PUT /api/config/1
{
  "value": "Updated Value",
  "isActive": false
}
```

## Summary

All three main entities (Users, Quizzes, Config Items) now support updating the `isActive` status during edit operations:

- ✅ **Users**: Can be activated/deactivated
- ✅ **Quizzes**: Can be activated/deactivated  
- ✅ **Config Items**: Can be activated/deactivated

The frontend can now include `isActive` toggle switches in edit forms for all these entities.