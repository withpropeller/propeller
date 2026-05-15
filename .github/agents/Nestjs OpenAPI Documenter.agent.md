---
description: 'Expert NestJS OpenAPI documentation agent that adds comprehensive Swagger/OpenAPI decorators to controllers and schemas. Automatically applies @ApiTags, @ApiOperation, @ApiParam, @ApiBearerAuth, @ApiResponseWrapper, @ApiBasicResponse, and @ApiCommonResponse decorators following project standards. Creates ApiHydrated response classes and ensures proper HTTP status codes. Use when: documenting new endpoints, updating existing controllers with OpenAPI specs, creating schema documentation, or preparing code for Orval API client generation.'
---


# OpenAPI Documentation Instructions

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Overview

OpenAPI documentation in this project involves:
1. Adding decorators to controller methods
2. Adding decorators to schema classes
3. Creating ApiHydrated response classes
4. Configuring proper HTTP status codes and response types

---

## Controller Documentation

### 1. Import Required Decorators

```typescript
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
} from '@common/decorators';
```

### 2. Add @ApiTags to Controller Class

Group all endpoints under a specific tag in OpenAPI spec:

```typescript
@ApiTags('resource-name')
@Controller('resource-name')
export class ResourceController {
    // endpoints...
}
```

### 3. Decorate Each Endpoint

#### For GET All (List) Endpoints

```typescript
@ApiOperation({ summary: 'Get All Resources' })
@ApiBearerAuth()
@Permission(Permissions.ResourcesRead)
@Get('/')
@HttpCode(HttpStatus.OK)
@ApiResponseListWrapper(ApiHydratedResource, 200, 'Resources retrieved successfully')
@ApiCommonResponse()
public getResources(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
    return this.service.findByQuery(query, { business: user.businessId });
}
```

#### For GET One Endpoint

```typescript
@ApiOperation({ summary: 'Get One Resource' })
@Permission(Permissions.ResourcesRead)
@ApiParam({ name: 'id', description: 'Resource ID', type: String })
@Get(':id')
@HttpCode(HttpStatus.OK)
@ApiResponseWrapper(ApiHydratedResource, 200, 'Resource retrieved successfully')
@ApiCommonResponse()
@ApiBasicResponse(404, 'Resource not found')
public async getOneResource(
    @Param() param: ParamTagIdDto,
    @CurrentUser() user: JWTUser,
    @Query() query: APIPagingDto,
) {
    return this.service.findOne({ _id: param.id, business: user.businessId });
}
```

#### For POST (Create) Endpoint

```typescript
@ApiOperation({ summary: 'Create Resource' })
@Permission(Permissions.ResourcesCreate)
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiResponseWrapper(Resource, 201, 'Resource created successfully')
@ApiCommonResponse()
public async createResource(@CurrentUser() user: JWTUser, @Body() body: CreateResourceDto) {
    return this.service.create(user, body);
}
```

#### For PUT (Update) Endpoint

```typescript
@ApiOperation({ summary: 'Update Resource' })
@ApiBearerAuth()
@Permission(Permissions.ResourcesUpdate)
@ApiParam({ name: 'id', description: 'Resource ID', type: String })
@Put(':id')
@HttpCode(HttpStatus.OK)
@ApiResponseWrapper(Resource, 200, 'Resource updated successfully')
@ApiCommonResponse()
@ApiBasicResponse(404, 'Resource not found')
public async updateResource(
    @Param() param: ParamTagIdDto,
    @CurrentUser() user: JWTUser,
    @Body() body: UpdateResourceDto,
) {
    return this.service.update(user, param.id, body);
}
```

#### For DELETE Endpoint

```typescript
@ApiOperation({ summary: 'Delete Resource' })
@ApiBearerAuth()
@Permission(Permissions.ResourcesDelete)
@ApiParam({ name: 'id', description: 'Resource ID', type: String })
@Delete(':id')
@HttpCode(HttpStatus.OK)
@ApiBasicResponse(200, 'Resource deleted successfully')
@ApiCommonResponse()
@ApiBasicResponse(404, 'Resource not found')
public async deleteResource(@Param() param: ParamTagIdDto, @CurrentUser() user: JWTUser) {
    return this.service.delete(user, param.id);
}
```

### 4. Decorator Reference

| Decorator | Purpose | Usage |
|-----------|---------|-------|
| `@ApiTags(string)` | Groups endpoints in OpenAPI spec | Class level |
| `@ApiOperation({ summary })` | Describes endpoint purpose | Method level |
| `@ApiBearerAuth()` | Marks endpoint as requiring authentication | Method level |
| `@ApiParam({ name, description, type })` | Documents path parameters | Method level (once per param) |
| `@ApiResponseWrapper(Type, status, description)` | Documents single object response | Method level |
| `@ApiResponseListWrapper(Type, status, description)` | Documents array response | Method level |
| `@ApiBasicResponse(status, description)` | Documents basic response (no data) | Method level |
| `@ApiCommonResponse()` | Documents standard error responses (400, 401, 403) | Method level |
| `@HttpCode(status)` | Sets HTTP status code | Method level |

---

## Schema Documentation

### 1. Import ApiProperty and ApiHydrated

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';
```

### 2. Add @ApiProperty to All Properties

Document each schema property with description and type information:

```typescript
@Schema()
export class Resource {
    @Prop()
    @ApiProperty({ description: 'Resource name' })
    name: string;

    @Prop()
    @ApiProperty({ description: 'Resource description' })
    description: string;

    @Prop({ default: true })
    @ApiProperty({ description: 'Is active', default: true, type: Boolean })
    isActive: boolean;

    @Prop()
    @ApiProperty({ description: 'Tags list', type: [String] })
    tags: string[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    @ApiProperty({ description: 'Creator user ID' })
    createdBy: any;

    @Prop({ type: SubSchemaName, _id: false })
    @ApiProperty({ description: 'Nested object', type: SubSchemaName })
    metadata: SubSchemaName;

    @Prop(enumProp(ResourceType))
    @ApiProperty({ description: 'Resource type', enum: ResourceType })
    type: ResourceType;

    @Prop({ type: Date })
    @ApiProperty({ description: 'Creation date', type: Date })
    createdAt: Date;
}
```

### 3. ApiProperty Type Reference

```typescript
// String property
@ApiProperty({ description: 'Name' })

// Number property
@ApiProperty({ description: 'Count', type: Number })

// Boolean property
@ApiProperty({ description: 'Is active', type: Boolean })

// Array of strings
@ApiProperty({ description: 'Tags', type: [String] })

// Array of objects
@ApiProperty({ description: 'Items', type: [ItemClass] })

// Required/Optional
@ApiProperty({ description: 'Name', required: true })
@ApiPropertyOptional({ description: 'Name' })  // preferred over required: false

// With default value
@ApiProperty({ description: 'Status', default: 'active' })

// Enum
@ApiProperty({ description: 'Type', enum: ResourceType })

// Reference to another class (ObjectId stored, string shown in API)
@ApiProperty({ description: 'Creator user ID', type: String })

// Nested schema class
@ApiProperty({ description: 'Address', type: Address })

// Array of nested schema classes
@ApiProperty({ description: 'Deposit channels', type: [DepositChannel] })
```

**Note:** For `@Prop({ type: MongooseSchema.Types.ObjectId, ref: '...' })` fields, always use `type: String` in `@ApiProperty` since the API exposes it as a string ID, not a populated object — unless the field is always populated and returned as an object.

### 4. Create ApiHydrated Class

`ApiHydrated` is a generic factory function from `@common/dtos` that extends any class by adding three standard MongoDB document fields with `@ApiProperty` decorators:
- `id: string` — the document's string ID
- `createdAt: Date` — creation timestamp
- `updatedAt: Date` — last updated timestamp

Always export it at the end of the schema file, right after `SchemaFactory.createForClass`:

```typescript
export const ResourceSchema = SchemaFactory.createForClass(Resource);
export const ApiHydratedResource = ApiHydrated(Resource);
```

Naming convention: always `ApiHydrated{ClassName}` (e.g. `ApiHydratedAccount`, `ApiHydratedTeam`).

A single schema file can export multiple hydrated classes when it defines multiple schemas:

```typescript
// accounts.schema.ts
export const ApiHydratedAccount = ApiHydrated(Account);
export const ApiHydratedAccountDepositAttempt = ApiHydrated(AccountDepositAttempt);
```

Can also be applied to sub-schemas that are independently returned as API responses:

```typescript
// budgets.schema.ts
export const ApiHydratedBudgetMember = ApiHydrated(BudgetMember); // sub-schema
export const ApiHydratedBudget = ApiHydrated(Budget);             // main schema
```

Can be applied to plain DTO classes (non-Mongoose schemas) when they are returned directly:

```typescript
// auth_response.ts
export const ApiHydratedUser = ApiHydrated(User); // User is a plain class, not a @Schema
```

This creates a response class that adds `id`, `createdAt`, and `updatedAt` to the OpenAPI spec. The global response envelope looks like:
```json
{
  "code": "success",
  "message": "Request successful",
  "data": { /* Resource object + id, createdAt, updatedAt */ }
}
```

When referencing an `ApiHydrated` class as a property type inside another DTO, use `InstanceType<typeof ...>`:

```typescript
export class AuthSuccessData {
    @ApiProperty({ description: 'User data', type: ApiHydratedUser })
    user: InstanceType<typeof ApiHydratedUser>;
}
```

**Do NOT** wrap a class with `ApiHydrated` if it will only ever appear as a nested field — only wrap classes that are the top-level `data` value in a response.

---

## Nested Schema Documentation

For nested schemas, add @ApiProperty to sub-classes as well:

```typescript
@Schema({ _id: false })
export class Address {
    @Prop()
    @ApiProperty({ description: 'Street address' })
    street: string;

    @Prop()
    @ApiProperty({ description: 'City' })
    city: string;

    @Prop()
    @ApiProperty({ description: 'Country code' })
    countryCode: string;
}

@Schema()
export class Resource {
    // ... other props
    
    @Prop({ type: AddressSchema, _id: false })
    @ApiProperty({ description: 'Resource address', type: Address })
    address: Address;
}
```

---

## Step-by-Step Implementation Checklist

### For Controllers:
- [ ] Add `@ApiTags('tag-name')` to controller class
- [ ] Import all required decorators from `@nestjs/swagger` and `@common/decorators`
- [ ] Import schema and ApiHydrated class from schema file
- [ ] Add `@ApiOperation({ summary: '...' })` to every endpoint
- [ ] Add `@ApiParam` for every path parameter (`:id`, etc.)
- [ ] Add `@ApiBearerAuth()` for protected endpoints
- [ ] Add `@HttpCode(status)` with appropriate status
- [ ] Add response decorators:
  - Single object: `@ApiResponseWrapper(Class, status, description)`
  - Array: `@ApiResponseListWrapper(Class, status, description)`
  - No data: `@ApiBasicResponse(status, description)`
- [ ] Add `@ApiCommonResponse()` for standard error handling
- [ ] Add specific error responses: `@ApiBasicResponse(404, 'Not found')`, etc.

### For Schemas:
- [ ] Import `ApiProperty` (and `ApiPropertyOptional` for optional fields) from `@nestjs/swagger`
- [ ] Import `ApiHydrated` from `@common/dtos`
- [ ] Add `@ApiProperty` to every `@Prop()` with description
- [ ] Use `@ApiPropertyOptional` for fields marked `required: false` in `@Prop`
- [ ] Include type information for complex types
- [ ] Document boolean fields with `type: Boolean`
- [ ] Document arrays with `type: [ElementType]`
- [ ] Document enums with `enum: EnumClass`
- [ ] Document nested objects with `type: NestedClass`
- [ ] For ObjectId references, use `type: String` unless the field is always populated
- [ ] Export `ApiHydrated(ClassName)` right after `SchemaFactory.createForClass` at end of file
- [ ] Export multiple `ApiHydrated` variants if the schema file defines multiple response-level classes
- [ ] Do NOT call `ApiHydrated` on sub-schemas that are only ever nested — only on classes returned as top-level `data`

---

## Common Patterns

### Paginated List Response
```typescript
@ApiOperation({ summary: 'Get All Items' })
@ApiBearerAuth()
@Get('/')
@HttpCode(HttpStatus.OK)
@ApiResponseListWrapper(ApiHydratedItem, 200, 'Items retrieved successfully')
@ApiCommonResponse()
public getItems(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
    return this.service.findByQuery(query, { business: user.businessId });
}
```

### Nested Path Parameters
```typescript
@ApiOperation({ summary: 'Get Team Member' })
@ApiParam({ name: 'teamId', description: 'Team ID', type: String })
@ApiParam({ name: 'memberId', description: 'Member ID', type: String })
@Get('teams/:teamId/members/:memberId')
@HttpCode(HttpStatus.OK)
@ApiResponseWrapper(ApiHydratedMember, 200, 'Member retrieved successfully')
@ApiCommonResponse()
@ApiBasicResponse(404, 'Team or member not found')
public async getMember(
    @Param() param: ParamNestedIdDto,
    @CurrentUser() user: JWTUser,
) {
    return this.service.findMember(param.teamId, param.memberId);
}
```

### Bulk Operations
```typescript
@ApiOperation({ summary: 'Bulk Update Items' })
@ApiBearerAuth()
@Post('/bulk')
@HttpCode(HttpStatus.OK)
@ApiResponseListWrapper(ApiHydratedItem, 200, 'Items updated successfully')
@ApiCommonResponse()
public async bulkUpdate(
    @CurrentUser() user: JWTUser,
    @Body() updates: BulkUpdateDto[],
) {
    return this.service.bulkUpdate(user, updates);
}
```

---

## Validation and Testing

After implementing OpenAPI documentation:

1. **Verify the OpenAPI spec:**
   ```bash
   yarn start:dev
   # Visit http://localhost:8000/api-docs
   ```

2. **Check Swagger UI:**
   - All endpoints should appear under their @ApiTags
   - Parameters should be properly documented
   - Response types should be clear

3. **Generate API Client:**
   ```bash
   make api-client
   # or
   npx orval --config orval.config.ts
   ```

4. **Verify Orval generation:**
   - No validation errors for path parameters
   - Response types properly typed
   - All endpoints included

5. **Run tests:**
   ```bash
   yarn test
   ```

---

## Troubleshooting

### Path Parameter Not Documented
**Problem:** Orval complains about missing parameter documentation
**Solution:** Ensure `@ApiParam({ name: 'id', description: '...', type: String })` is added to method

### Response Type Not Generated
**Problem:** Orval can't generate proper response type
**Solution:** Ensure endpoint uses `@ApiResponseWrapper` with proper class reference

### Circular References
**Problem:** ApiHydrated class references cause circular imports
**Solution:** Import ApiHydrated class after schema is defined, use it only in exports

### ApiHydrated Class Name in Swagger
**Problem:** Multiple hydrated classes show the same generic name in Swagger UI
**Solution:** `ApiHydrated` automatically sets `name` to `ApiHydrated_{ClassName}` via `Object.defineProperty`, so each class gets a unique name — no manual fix needed

### Using ApiHydrated as a Property Type
**Problem:** Type error when assigning `ApiHydrated` result as a TypeScript property type
**Solution:** Use `InstanceType<typeof ApiHydratedResource>` as the TypeScript type:
```typescript
@ApiProperty({ description: 'Resource', type: ApiHydratedResource })
resource: InstanceType<typeof ApiHydratedResource>;
```

### Type Information Missing
**Problem:** Properties show as `unknown` in generated client
**Solution:** Add `type` parameter to @ApiProperty for complex types

---

## Best Practices

1. **Always use descriptive summaries** - Make them action-oriented: "Create User", "Get Account Balance"
2. **Document all parameters** - Even if obvious, include description in @ApiParam
3. **Be specific with error responses** - Document which 404/400 errors are possible
4. **Use consistent naming** - Follow the existing naming convention in decorators
5. **Test after changes** - Always regenerate OpenAPI spec and test Orval generation
6. **Keep schemas and controllers in sync** - Update both when adding new properties
7. **Use nested @ApiProperty** - Document nested schemas at multiple levels
8. **Group related endpoints** - Use same @ApiTags value for related operations

---

## References

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Orval Documentation](https://orval.dev/)