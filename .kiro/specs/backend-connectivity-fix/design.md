# Design Document - Backend Connectivity Fix

## Overview

Este diseño aborda los problemas de conectividad entre el frontend React y el backend FastAPI, enfocándose en resolver errores CORS, errores 500 del servidor, y establecer un sistema robusto de manejo de errores y reconexión.

## Architecture

### Current Issues Identified
1. **CORS Configuration**: El backend no está configurado para permitir peticiones desde localhost:3000
2. **Server Errors**: El endpoint `/usuarios/` está devolviendo error 500
3. **Error Handling**: El frontend no maneja adecuadamente los errores de conexión
4. **Backend Status**: El servidor backend puede no estar ejecutándose correctamente

### Solution Architecture
```
Frontend (React:3000) <---> CORS Middleware <---> Backend (FastAPI:8000) <---> Database
                                |
                         Error Handler & Logger
```

## Components and Interfaces

### 1. Backend CORS Configuration
**File**: `Servidor/main.py` (or equivalent FastAPI main file)
- Configure CORS middleware to allow localhost:3000
- Set appropriate headers for development environment
- Enable credentials if needed for authentication

### 2. Enhanced Error Handling (Frontend)
**File**: `frontend/src/hooks/useApi.ts`
- Improve error detection and categorization
- Add retry logic for network failures
- Better error messages for different scenarios

### 3. Connection Status Monitor
**File**: `frontend/src/hooks/useConnectionStatus.ts`
- Monitor backend availability
- Provide connection status to components
- Handle automatic reconnection attempts

### 4. Backend Health Check Endpoint
**File**: Backend health endpoint
- Simple endpoint to verify server status
- Database connection verification
- Return system status information

## Data Models

### Error Response Model
```typescript
interface ApiError {
  message: string;
  status: number;
  details: string;
  timestamp: string;
  endpoint: string;
}
```

### Connection Status Model
```typescript
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  retryCount: number;
  error?: ApiError;
}
```

## Error Handling

### CORS Errors
- **Detection**: Check for CORS-specific error messages
- **Resolution**: Configure backend CORS middleware
- **User Feedback**: Show "Server configuration issue" message

### Network Errors
- **Detection**: Check for network failure status codes
- **Resolution**: Implement retry logic with exponential backoff
- **User Feedback**: Show "Connection problem" with retry option

### Server Errors (5xx)
- **Detection**: Status codes 500-599
- **Resolution**: Log detailed error information
- **User Feedback**: Show "Server error" with support contact

### Authentication Errors
- **Detection**: Status codes 401, 403
- **Resolution**: Redirect to login or refresh token
- **User Feedback**: Show "Session expired" message

## Testing Strategy

### Backend Testing
1. **CORS Testing**: Verify cross-origin requests work
2. **Endpoint Testing**: Test all API endpoints return correct responses
3. **Error Handling**: Test error scenarios return appropriate status codes
4. **Health Check**: Verify health endpoint responds correctly

### Frontend Testing
1. **Connection Testing**: Test with backend online/offline
2. **Error Handling**: Test different error scenarios
3. **Retry Logic**: Test automatic reconnection
4. **User Experience**: Test error messages display correctly

### Integration Testing
1. **Full Flow**: Test complete user workflows
2. **Error Recovery**: Test system recovery from errors
3. **Performance**: Test response times under load
4. **Security**: Test authentication flows work correctly

## Implementation Steps

### Phase 1: Backend Configuration
1. Configure CORS middleware in FastAPI
2. Fix the `/usuarios/` endpoint error
3. Add health check endpoint
4. Improve error logging

### Phase 2: Frontend Error Handling
1. Enhance useApi hook with better error handling
2. Create connection status monitoring
3. Implement retry logic
4. Improve user error messages

### Phase 3: Integration & Testing
1. Test all endpoints work correctly
2. Verify CORS configuration
3. Test error scenarios
4. Performance optimization

## Configuration Requirements

### Backend Environment
- CORS origins: `["http://localhost:3000", "http://127.0.0.1:3000"]`
- CORS methods: `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`
- CORS headers: `["*"]` for development
- Debug logging enabled

### Frontend Environment
- API base URL: `http://127.0.0.1:8000` or `http://localhost:8000`
- Retry attempts: 3
- Retry delay: 1000ms with exponential backoff
- Connection timeout: 10 seconds

## Security Considerations

### Development vs Production
- Development: Permissive CORS for localhost
- Production: Restrictive CORS for specific domains
- Environment-based configuration

### Error Information
- Development: Detailed error messages
- Production: Generic error messages
- Sensitive information protection

## Monitoring and Logging

### Backend Logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Database connection status

### Frontend Logging
- API call tracking
- Error occurrence logging
- User action tracking
- Performance monitoring