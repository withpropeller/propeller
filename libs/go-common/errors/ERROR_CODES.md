# Error Codes Reference

This document provides a comprehensive reference for all error codes used across the Stanza Business platform.

## Standard HTTP Error Codes

### 400 Bad Request
- **`bad-request`**: Invalid request format or parameters

### 401 Unauthorized  
- **`unauthorized`**: Authentication required or invalid credentials

### 403 Forbidden
- **`forbidden`**: Access denied to the requested resource

### 404 Not Found
- **`not-found`**: Requested resource does not exist

### 409 Conflict
- **`conflict`**: Generic resource conflict
- **`domain-already-exists`**: Email domain already registered by another business

### 422 Unprocessable Entity
- **`validation-error`**: Request validation failed

### 500 Internal Server Error
- **`internal-server-error`**: Unexpected server error

## Domain-Specific Error Codes

### `domain-already-exists`

**HTTP Status**: `409 Conflict`

**Description**: The email domain is already registered by another business.

**Response Format**:
```json
{
  "code": "domain-already-exists",
  "message": "This email domain is already registered by another business. Please ask your admin to invite you or use a different email address."
}
```

**Frontend Handling**:
The frontend should display a user-friendly message with clear next steps:

1. **Option 1**: Ask user to request an invitation from their admin
2. **Option 2**: Suggest using a different email address
3. **Option 3**: Provide a "Join Existing Business" flow

**Example Frontend Implementation**:
```typescript
if (error.code === 'domain-already-exists') {
  showDialog({
    title: 'Domain Already Registered',
    message: 'This email domain is already registered by another business.',
    actions: [
      { text: 'Request Invitation', action: 'request-invitation' },
      { text: 'Use Different Email', action: 'change-email' },
      { text: 'Join Existing Business', action: 'join-business' }
    ]
  });
}
```

## Error Response Structure

All error responses follow this consistent format:

```json
{
  "code": "error-code",
  "message": "Human-readable error message"
}
```

## Best Practices

### For Backend Developers
1. **Use Specific Error Codes**: Choose the most specific error code that describes the situation
2. **Provide Clear Messages**: Write error messages that help users understand what went wrong
3. **Include Actionable Guidance**: When possible, suggest what the user can do to resolve the issue

### For Frontend Developers
1. **Handle Error Codes**: Check the `code` field for programmatic error handling
2. **Display User-Friendly Messages**: Use the `message` field for user display
3. **Provide Next Steps**: Guide users toward resolution when possible

## Error Code Naming Convention

- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Use present tense
- Examples:
  - ✅ `domain-already-exists`
  - ✅ `validation-error`
  - ✅ `user-not-found`
  - ❌ `DomainAlreadyExists`
  - ❌ `validation_error`
  - ❌ `user-not-found-error`

## Adding New Error Codes

When adding new error codes:

1. **Add the constant** in `errors.go`:
   ```go
   const (
       CodeNewError = "new-error"
   )
   ```

2. **Add the error instance**:
   ```go
   var (
       ErrNewError = New(CodeNewError, "Description", http.StatusCode)
   )
   ```

3. **Update this documentation** with usage examples and frontend handling guidance

4. **Test the error response** to ensure it provides clear guidance to users
