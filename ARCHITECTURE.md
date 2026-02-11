# Corporate Website Architecture

> **Enterprise-grade web architecture with automatic compliance and design enforcement through APM dependency composition**

This document provides a comprehensive overview of the corporate website's system architecture, demonstrating APM (AI-Native Package Manager) capabilities for enterprise development with built-in GDPR compliance and WCAG 2.1 AA accessibility.

## Table of Contents

- [High-Level System Overview](#high-level-system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow Architecture](#data-flow-architecture)
- [APM Context Optimization Engine](#apm-context-optimization-engine)
- [GDPR Compliance Architecture](#gdpr-compliance-architecture)
- [Module Interaction Patterns](#module-interaction-patterns)
- [Technology Stack](#technology-stack)

## High-Level System Overview

The corporate website is built on a modern, separation-of-concerns architecture that integrates compliance and design standards through APM dependencies.

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        UI[User Interface<br/>Vite + React + TypeScript]
    end
    
    subgraph "Frontend Application"
        Components[React Components<br/>ContactForm, Header]
        Validation[Client Validation<br/>validation.ts]
        API_Client[API Client<br/>contact.ts]
    end
    
    subgraph "Backend Services"
        FastAPI[FastAPI Server<br/>Python]
        Users_API[Users API<br/>users.py]
        Contact_Handler[Contact Handler<br/>contact_handler.py]
    end
    
    subgraph "Data & Storage"
        Database[(Database<br/>User Data)]
        AuditLog[(Audit Logs<br/>GDPR Compliance)]
    end
    
    subgraph "APM Dependencies"
        ComplianceRules[Compliance Rules<br/>GDPR Standards]
        DesignGuidelines[Design Guidelines<br/>WCAG 2.1 AA]
        ContextEngine[Context Optimization<br/>Engine]
    end
    
    subgraph "APM Output"
        AgentsMD[AGENTS.md Files<br/>Optimized Context]
        Workflows[Enterprise Workflows<br/>audit, accessibility]
    end
    
    Browser --> UI
    UI --> Components
    Components --> Validation
    Components --> API_Client
    API_Client --> FastAPI
    FastAPI --> Users_API
    FastAPI --> Contact_Handler
    Contact_Handler --> Database
    Contact_Handler --> AuditLog
    
    ComplianceRules --> ContextEngine
    DesignGuidelines --> ContextEngine
    ContextEngine --> AgentsMD
    ContextEngine --> Workflows
    
    AgentsMD -.->|Guides Development| Components
    AgentsMD -.->|Guides Development| FastAPI
    Workflows -.->|Enforces Standards| Components
    Workflows -.->|Enforces Standards| Contact_Handler
    
    style ComplianceRules fill:#e1f5ff
    style DesignGuidelines fill:#e1f5ff
    style ContextEngine fill:#fff4e1
    style AgentsMD fill:#e8f5e9
    style Workflows fill:#e8f5e9
    style AuditLog fill:#ffebee
    style Database fill:#f3e5f5
```

### Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between frontend, backend, and data layers
2. **Compliance by Design**: GDPR requirements integrated at architectural level through APM dependencies
3. **Accessibility First**: WCAG 2.1 AA standards enforced via design guidelines dependency
4. **Context Optimization**: APM engine minimizes cognitive load while ensuring full coverage
5. **Universal Compatibility**: Standard AGENTS.md output works with all major coding agents

## Component Architecture

The application follows a modular component architecture with clear responsibilities and interaction patterns.

```mermaid
graph LR
    subgraph "Frontend Components"
        ContactForm[ContactForm.tsx<br/>Form Management]
        Header[Header.tsx<br/>Navigation]
        FormValidation[Form Validation<br/>Client-side]
    end
    
    subgraph "API Layer"
        ContactAPI[contact.ts<br/>Form Submission API]
        ValidationUtils[validation.ts<br/>Security & Validation]
        AuditAPI[Audit Logging API<br/>GDPR Compliance]
    end
    
    subgraph "Backend Services"
        ContactHandler[contact_handler.py<br/>Server-side Processing]
        UsersEndpoint[users.py<br/>User Management]
        RateLimiter[Rate Limiter<br/>Abuse Prevention]
        DataRetention[Data Retention Manager<br/>GDPR Compliance]
    end
    
    subgraph "Security & Compliance"
        CSRF[CSRF Protection<br/>Token Validation]
        InputSanitization[Input Sanitization<br/>XSS Prevention]
        IPHashing[IP Hashing<br/>Privacy Protection]
        AuditLogger[Audit Logger<br/>Compliance Trail]
    end
    
    ContactForm --> FormValidation
    FormValidation --> ContactAPI
    ContactAPI --> ValidationUtils
    ContactAPI --> AuditAPI
    
    ContactAPI --> ContactHandler
    ContactHandler --> CSRF
    ContactHandler --> InputSanitization
    ContactHandler --> IPHashing
    ContactHandler --> RateLimiter
    ContactHandler --> DataRetention
    ContactHandler --> AuditLogger
    
    UsersEndpoint --> AuditLogger
    
    style ContactForm fill:#e3f2fd
    style ContactAPI fill:#fff3e0
    style ContactHandler fill:#f3e5f5
    style CSRF fill:#ffebee
    style InputSanitization fill:#ffebee
    style IPHashing fill:#ffebee
    style AuditLogger fill:#e8f5e9
    style DataRetention fill:#e8f5e9
```

### Component Responsibilities

#### Frontend Components

- **ContactForm.tsx**: React component with accessibility features (ARIA labels, keyboard navigation)
- **Header.tsx**: Navigation component following design system standards
- **Form Validation**: Client-side validation for immediate user feedback

#### API Layer

- **contact.ts**: Handles form submission with GDPR compliance measures
- **validation.ts**: Security utilities (input sanitization, email validation, rate limiting)
- **Audit API**: Logs user interactions for compliance trail

#### Backend Services

- **contact_handler.py**: Server-side contact form processing with full compliance
- **users.py**: FastAPI user management endpoints
- **Rate Limiter**: Prevents abuse (5 requests per 5 minutes)
- **Data Retention Manager**: Implements GDPR retention policies

## Data Flow Architecture

This diagram shows the complete flow for a contact form submission, demonstrating validation, security, and audit logging at each stage.

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant ContactForm
    participant ValidationUtils
    participant ContactAPI
    participant FastAPI
    participant ContactHandler
    participant RateLimiter
    participant CSRFValidator
    participant Database
    participant AuditLog
    
    User->>Browser: Fill contact form
    Browser->>ContactForm: Submit form data
    
    Note over ContactForm: Client-side validation
    ContactForm->>ValidationUtils: Validate input
    ValidationUtils-->>ContactForm: Validation result
    
    alt Validation fails
        ContactForm->>User: Show error messages
    else Validation succeeds
        ContactForm->>ContactAPI: Submit form data
        
        Note over ContactAPI: Security measures
        ContactAPI->>ContactAPI: Sanitize input
        ContactAPI->>ContactAPI: Get CSRF token
        
        ContactAPI->>AuditLog: Log submission attempt
        
        ContactAPI->>FastAPI: POST /api/contact
        FastAPI->>ContactHandler: Process submission
        
        ContactHandler->>CSRFValidator: Validate CSRF token
        CSRFValidator-->>ContactHandler: Token valid
        
        ContactHandler->>ContactHandler: Hash IP address
        ContactHandler->>RateLimiter: Check rate limit
        
        alt Rate limit exceeded
            RateLimiter-->>ContactHandler: Blocked
            ContactHandler->>AuditLog: Log rate limit violation
            ContactHandler-->>FastAPI: Error: Rate limit
            FastAPI-->>ContactAPI: 429 Too Many Requests
            ContactAPI->>User: Show error
        else Rate limit OK
            RateLimiter-->>ContactHandler: Allowed
            
            ContactHandler->>ContactHandler: Validate input
            ContactHandler->>ContactHandler: Check consent
            
            ContactHandler->>Database: Store contact data
            Database-->>ContactHandler: Success
            
            ContactHandler->>AuditLog: Log successful submission
            Note over AuditLog: Retention: 7 years<br/>Fields: timestamp, event_type,<br/>ip_hash, user_agent
            
            ContactHandler-->>FastAPI: Success response
            FastAPI-->>ContactAPI: 200 OK
            ContactAPI->>AuditLog: Log success event
            ContactAPI->>User: Show success message
        end
    end
```

### Data Flow Security Layers

1. **Client-Side Validation**: Immediate feedback, prevents obviously invalid data
2. **CSRF Protection**: Token-based validation prevents cross-site attacks
3. **Input Sanitization**: Removes potentially malicious content (XSS prevention)
4. **Rate Limiting**: Prevents abuse and DoS attacks
5. **IP Hashing**: Protects user privacy while maintaining audit trail
6. **Audit Logging**: Complete compliance trail for GDPR requirements

## APM Context Optimization Engine

The APM Context Optimization Engine is the core innovation that enables intelligent context distribution to AI coding agents while maintaining universal compatibility.

```mermaid
graph TB
    subgraph "Source: Modular Context"
        Instructions[.apm/instructions/<br/>.instructions.md Files]
        ApplyTo[applyTo Patterns<br/>YAML Frontmatter]
    end
    
    subgraph "APM Optimization Engine"
        Parser[Pattern Parser<br/>Extract applyTo Rules]
        Analyzer[Distribution Analyzer<br/>Calculate Coverage]
        Optimizer[Placement Optimizer<br/>Minimize Cognitive Load]
        Compiler[AGENTS.md Compiler<br/>Universal Format]
    end
    
    subgraph "Optimization Algorithm"
        Coverage[Coverage Calculation<br/>Ensure 100% Pattern Match]
        Distribution[Distribution Score<br/>0-30%: Local<br/>30-70%: Multi<br/>70%+: Root]
        Efficiency[Context Efficiency<br/>Relevant/Total Instructions]
    end
    
    subgraph "Output: Universal Standard"
        RootAgents[Root AGENTS.md<br/>Global Patterns]
        BackendAgents[backend/api/AGENTS.md<br/>Backend Patterns]
        TestsAgents[tests/AGENTS.md<br/>Testing Patterns]
        DocsAgents[docs/AGENTS.md<br/>Documentation Patterns]
        ScriptsAgents[scripts/AGENTS.md<br/>Deployment Patterns]
    end
    
    subgraph "Universal Compatibility"
        Copilot[GitHub Copilot]
        Cursor[Cursor]
        Claude[Claude]
        CustomAgents[Custom Agents<br/>agents.md Standard]
    end
    
    Instructions --> Parser
    ApplyTo --> Parser
    Parser --> Analyzer
    Analyzer --> Coverage
    Analyzer --> Distribution
    Coverage --> Optimizer
    Distribution --> Optimizer
    Optimizer --> Efficiency
    Efficiency --> Compiler
    
    Compiler --> RootAgents
    Compiler --> BackendAgents
    Compiler --> TestsAgents
    Compiler --> DocsAgents
    Compiler --> ScriptsAgents
    
    RootAgents -.->|Standard Format| Copilot
    BackendAgents -.->|Standard Format| Cursor
    TestsAgents -.->|Standard Format| Claude
    DocsAgents -.->|Standard Format| CustomAgents
    
    style Instructions fill:#e3f2fd
    style ApplyTo fill:#e3f2fd
    style Parser fill:#fff3e0
    style Analyzer fill:#fff3e0
    style Optimizer fill:#fff3e0
    style Compiler fill:#fff3e0
    style Coverage fill:#e8f5e9
    style Distribution fill:#e8f5e9
    style Efficiency fill:#e8f5e9
    style RootAgents fill:#f3e5f5
    style BackendAgents fill:#f3e5f5
    style TestsAgents fill:#f3e5f5
```

### Context Optimization Algorithm

The APM engine uses mathematical optimization to determine optimal placement of context instructions:

#### Distribution Score Calculation
```
distribution_score = matching_patterns / total_patterns

Where:
- matching_patterns: Number of file types that match the applyTo pattern
- total_patterns: Total number of file types in the project
```

#### Placement Strategy
- **0-30% distribution**: Place locally (e.g., `backend/**/*.py` → `backend/api/AGENTS.md`)
- **30-70% distribution**: Smart multi-placement with coverage verification
- **70%+ distribution**: Place at root (e.g., `**/*.{js,ts,tsx}` → root `AGENTS.md`)

#### Optimization Goals
1. **Full Coverage**: Every pattern matches files that can access appropriate AGENTS.md
2. **Minimal Pollution**: Each AGENTS.md contains only relevant instructions
3. **Maximum Efficiency**: `Context_Efficiency = Relevant_Instructions / Total_Instructions`
4. **Universal Output**: Standard AGENTS.md format for all coding agents

### Real Example from This Project

```yaml
# Source: .apm/instructions/backend.instructions.md
---
applyTo: "backend/**/*.py"
---
# Backend development guidelines...
```

**APM Optimization Result:**
- Distribution Score: 5.6% (backend-only)
- Strategy: Single Point Placement
- Output: `backend/api/AGENTS.md`
- Coverage: ✅ Perfect (100% backend files covered)
- Efficiency: 100% (zero frontend pollution)

**Project-Wide Metrics:**
- Context Efficiency: 49.6%
- AGENTS.md Files Created: 5 (root, backend/api, tests, docs, scripts)
- Universal Compatibility: ✅ All major coding agents

## GDPR Compliance Architecture

GDPR compliance is enforced through architectural patterns, not just code-level checks. This ensures privacy protection at every layer.

```mermaid
graph TB
    subgraph "Data Collection"
        UserInput[User Input<br/>Name, Email, Message]
        ConsentCheck[Consent Verification<br/>Required Before Processing]
        DataMinimization[Data Minimization<br/>Only Essential Fields]
    end
    
    subgraph "Data Processing"
        Validation[Input Validation<br/>Security & Format]
        Sanitization[Data Sanitization<br/>XSS Prevention]
        Anonymization[IP Hashing<br/>Privacy Protection]
    end
    
    subgraph "Data Storage"
        EncryptedDB[(Encrypted Storage<br/>At Rest & Transit)]
        RetentionPolicy[Retention Policies<br/>Contact: 5 years<br/>Audit: 7 years<br/>Sessions: 30 days]
        AccessControl[Access Controls<br/>Role-Based Permissions]
    end
    
    subgraph "Audit & Compliance"
        AuditTrail[(Audit Logs<br/>All Data Operations)]
        ComplianceReports[Compliance Reports<br/>Data Processing Activities]
        BreachNotification[Breach Notification<br/>72-hour Protocol]
    end
    
    subgraph "User Rights"
        DataExport[Right to Access<br/>Data Export API]
        DataDeletion[Right to Erasure<br/>Deletion API]
        DataPortability[Right to Portability<br/>Machine-Readable Format]
        Rectification[Right to Rectification<br/>Update API]
    end
    
    UserInput --> ConsentCheck
    ConsentCheck --> DataMinimization
    DataMinimization --> Validation
    Validation --> Sanitization
    Sanitization --> Anonymization
    
    Anonymization --> EncryptedDB
    EncryptedDB --> RetentionPolicy
    EncryptedDB --> AccessControl
    
    Validation -.->|Log All Events| AuditTrail
    Sanitization -.->|Log All Events| AuditTrail
    EncryptedDB -.->|Log All Events| AuditTrail
    
    AuditTrail --> ComplianceReports
    EncryptedDB --> BreachNotification
    
    EncryptedDB --> DataExport
    EncryptedDB --> DataDeletion
    EncryptedDB --> DataPortability
    EncryptedDB --> Rectification
    
    DataExport -.->|Log Access| AuditTrail
    DataDeletion -.->|Log Deletion| AuditTrail
    DataPortability -.->|Log Export| AuditTrail
    Rectification -.->|Log Update| AuditTrail
    
    style ConsentCheck fill:#ffebee
    style DataMinimization fill:#ffebee
    style Anonymization fill:#e8f5e9
    style EncryptedDB fill:#e8f5e9
    style RetentionPolicy fill:#e8f5e9
    style AuditTrail fill:#fff3e0
    style DataExport fill:#e3f2fd
    style DataDeletion fill:#e3f2fd
    style DataPortability fill:#e3f2fd
    style Rectification fill:#e3f2fd
```

### GDPR Compliance Implementation

#### 1. Data Minimization
- Only collect essential fields: name, email, message
- No tracking cookies or unnecessary analytics
- Clear purpose statement for each data point

#### 2. Consent Management
- Explicit consent required before form submission
- Clear privacy policy linked at submission
- Opt-in only (no pre-checked boxes)

#### 3. Data Protection
```python
# IP Address Hashing (privacy protection)
def hash_ip_address(ip_address: str) -> str:
    salt = "corporate_website_salt_2025"
    salted_ip = f"{ip_address}{salt}"
    return hashlib.sha256(salted_ip.encode()).hexdigest()
```

#### 4. Audit Trail
All data operations are logged:
- Form submission attempts
- Validation errors
- Successful submissions
- Data export requests
- Data deletion requests

#### 5. Retention Policies
```python
RETENTION_POLICIES = {
    'contact_forms': timedelta(days=5*365),  # 5 years
    'audit_logs': timedelta(days=7*365),     # 7 years
    'user_sessions': timedelta(days=30),     # 30 days
}
```

#### 6. User Rights Implementation
- **Right to Access**: `GET /api/users/{userId}/export`
- **Right to Erasure**: `DELETE /api/users/{userId}`
- **Right to Portability**: JSON/CSV export format
- **Right to Rectification**: `PATCH /api/users/{userId}`

## Module Interaction Patterns

The system follows clear interaction patterns between frontend, backend, and storage layers.

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface<br/>React Components]
        State[State Management<br/>React Hooks]
        ClientVal[Client Validation<br/>Immediate Feedback]
    end
    
    subgraph "API Abstraction Layer"
        APIClient[API Client<br/>HTTP Requests]
        ErrorHandler[Error Handling<br/>User-Friendly Messages]
        Interceptors[Request Interceptors<br/>CSRF, Auth, Headers]
    end
    
    subgraph "Backend Application Layer"
        Router[FastAPI Router<br/>Endpoint Routing]
        Middleware[Middleware Stack<br/>CORS, Security, Logging]
        Controllers[Request Controllers<br/>Business Logic]
    end
    
    subgraph "Service Layer"
        ContactService[Contact Service<br/>Form Processing]
        UserService[User Service<br/>User Management]
        AuditService[Audit Service<br/>Compliance Logging]
        ValidationService[Validation Service<br/>Security Checks]
    end
    
    subgraph "Data Access Layer"
        ORM[ORM/Data Models<br/>Type Safety]
        QueryBuilder[Query Builder<br/>Safe SQL Generation]
        ConnectionPool[Connection Pool<br/>Performance]
    end
    
    subgraph "Storage Layer"
        PostgreSQL[(PostgreSQL<br/>Primary Database)]
        Redis[(Redis<br/>Cache & Sessions)]
        S3[(S3/Storage<br/>File Uploads)]
    end
    
    UI --> State
    State --> ClientVal
    ClientVal --> APIClient
    APIClient --> ErrorHandler
    APIClient --> Interceptors
    
    Interceptors --> Router
    Router --> Middleware
    Middleware --> Controllers
    
    Controllers --> ContactService
    Controllers --> UserService
    Controllers --> AuditService
    Controllers --> ValidationService
    
    ContactService --> ORM
    UserService --> ORM
    AuditService --> ORM
    ValidationService --> ORM
    
    ORM --> QueryBuilder
    QueryBuilder --> ConnectionPool
    
    ConnectionPool --> PostgreSQL
    ConnectionPool --> Redis
    ConnectionPool --> S3
    
    AuditService -.->|Async Logging| PostgreSQL
    ValidationService -.->|Cache Results| Redis
    
    style UI fill:#e3f2fd
    style APIClient fill:#fff3e0
    style Router fill:#f3e5f5
    style ContactService fill:#e8f5e9
    style ORM fill:#ffebee
    style PostgreSQL fill:#fce4ec
    style Redis fill:#fce4ec
    style S3 fill:#fce4ec
```

### Interaction Flow Patterns

#### 1. Request Flow (Frontend → Backend)
```
User Action → React Component → API Client → FastAPI Router → 
Service Layer → Data Access → Database
```

#### 2. Response Flow (Backend → Frontend)
```
Database → Data Access → Service Layer → Controller → 
FastAPI Response → API Client → React Component → UI Update
```

#### 3. Error Handling Flow
```
Error → Service Layer → Controller → Error Handler → 
API Client → User-Friendly Message → UI Display
```

#### 4. Audit Logging Flow (Asynchronous)
```
Any Data Operation → Audit Service → Async Queue → 
Audit Log Database → Compliance Reports
```

## Technology Stack

### Frontend
- **Build Tool**: Vite 7.1.5 (fast, modern development)
- **Language**: TypeScript (type safety)
- **Framework**: React (component-based UI)
- **Styling**: SCSS (maintainable styles)
- **Accessibility**: WCAG 2.1 AA compliance (enforced by design-guidelines dependency)

### Backend
- **Framework**: FastAPI (Python, high performance)
- **Language**: Python 3.x (type hints, async support)
- **API Style**: RESTful HTTP/JSON
- **Validation**: Pydantic models (automatic validation)

### Security
- **CSRF Protection**: Token-based validation
- **Input Sanitization**: XSS prevention
- **Rate Limiting**: Abuse prevention (5 req/5 min)
- **IP Hashing**: Privacy protection (SHA-256)
- **HTTPS**: TLS encryption in transit

### Compliance
- **GDPR**: Built-in compliance (danielmeppiel/compliance-rules dependency)
- **Audit Logging**: Complete operation trail
- **Data Retention**: Automated policy enforcement
- **User Rights**: Export, deletion, portability APIs

### Development Tools
- **APM CLI**: Dependency management and context optimization
- **APM Dependencies**:
  - `danielmeppiel/compliance-rules`: GDPR standards
  - `danielmeppiel/design-guidelines`: WCAG 2.1 AA accessibility
- **Code Quality**: Accessibility testing (axe-core, pa11y, lighthouse)

### Deployment
- **Build**: `npm run build` (Vite production build)
- **Server**: `npm run dev` (development), `npm run preview` (production preview)
- **Workflows**: APM enterprise workflows (audit, accessibility, design review)

## Architecture Decision Records

### Why APM for Context Management?

**Problem**: AI coding agents need relevant context without cognitive overload. Traditional approaches either overwhelm agents with all instructions or miss critical guidelines.

**Solution**: APM's Context Optimization Engine mathematically determines optimal placement of context instructions:
- **Modular Source**: `.instructions.md` files with `applyTo` patterns
- **Smart Compilation**: Algorithms analyze distribution and place optimally
- **Universal Output**: Standard `AGENTS.md` files work with all major agents

**Result**: 49.6% context efficiency with 100% coverage guarantee.

### Why FastAPI for Backend?

**Reasons**:
1. **Performance**: Async support for high concurrency
2. **Type Safety**: Automatic validation with Pydantic
3. **API Documentation**: Auto-generated OpenAPI/Swagger
4. **Modern Python**: Type hints, async/await patterns

### Why Vite for Frontend?

**Reasons**:
1. **Speed**: Near-instant HMR (Hot Module Replacement)
2. **Modern**: ES modules, tree-shaking, code splitting
3. **TypeScript**: First-class TypeScript support
4. **Simplicity**: Minimal configuration required

### Why GDPR Compliance at Architecture Level?

**Approach**: Compliance enforced through architectural patterns, not just code checks.

**Benefits**:
1. **Impossible to Bypass**: Built into system structure
2. **Audit Trail**: Automatic logging at every layer
3. **User Rights**: API-first implementation (export, delete, portability)
4. **Data Minimization**: Only essential fields collected
5. **Retention Policies**: Automated enforcement

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Devices"
        Desktop[Desktop Browser]
        Mobile[Mobile Browser]
        Tablet[Tablet Browser]
    end
    
    subgraph "CDN Layer"
        CDN[Content Delivery Network<br/>Static Assets<br/>CSS, JS, Images]
    end
    
    subgraph "Load Balancer"
        LB[Load Balancer<br/>SSL Termination<br/>Health Checks]
    end
    
    subgraph "Application Servers"
        App1[App Server 1<br/>Vite Frontend<br/>FastAPI Backend]
        App2[App Server 2<br/>Vite Frontend<br/>FastAPI Backend]
        App3[App Server 3<br/>Vite Frontend<br/>FastAPI Backend]
    end
    
    subgraph "Data Layer"
        DBPrimary[(Primary Database<br/>Read/Write)]
        DBReplica1[(Replica 1<br/>Read Only)]
        DBReplica2[(Replica 2<br/>Read Only)]
        CacheLayer[(Redis Cache<br/>Sessions & Data)]
    end
    
    subgraph "Monitoring & Logging"
        Logs[Centralized Logging<br/>ELK Stack]
        Metrics[Metrics & Alerts<br/>Prometheus/Grafana]
        AuditDB[(Audit Database<br/>GDPR Compliance)]
    end
    
    Desktop --> CDN
    Mobile --> CDN
    Tablet --> CDN
    CDN --> LB
    
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> CacheLayer
    App2 --> CacheLayer
    App3 --> CacheLayer
    
    App1 --> DBPrimary
    App2 --> DBPrimary
    App3 --> DBPrimary
    
    DBPrimary -.->|Replication| DBReplica1
    DBPrimary -.->|Replication| DBReplica2
    
    App1 -.->|Read| DBReplica1
    App2 -.->|Read| DBReplica2
    App3 -.->|Read| DBReplica1
    
    App1 -.->|Logs| Logs
    App2 -.->|Logs| Logs
    App3 -.->|Logs| Logs
    
    App1 -.->|Metrics| Metrics
    App2 -.->|Metrics| Metrics
    App3 -.->|Metrics| Metrics
    
    App1 -.->|Audit Events| AuditDB
    App2 -.->|Audit Events| AuditDB
    App3 -.->|Audit Events| AuditDB
    
    style CDN fill:#e3f2fd
    style LB fill:#fff3e0
    style App1 fill:#e8f5e9
    style App2 fill:#e8f5e9
    style App3 fill:#e8f5e9
    style DBPrimary fill:#f3e5f5
    style CacheLayer fill:#ffebee
    style AuditDB fill:#fce4ec
```

## Performance Considerations

### Frontend Performance
- **Code Splitting**: Dynamic imports for route-based splitting
- **Tree Shaking**: Remove unused code in production builds
- **Asset Optimization**: Minification, compression (gzip/brotli)
- **Lazy Loading**: Load components and images on demand
- **Caching Strategy**: Service workers, cache-first for static assets

### Backend Performance
- **Async Operations**: Non-blocking I/O with async/await
- **Connection Pooling**: Reuse database connections
- **Response Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexes
- **Rate Limiting**: Prevent abuse and ensure fair resource distribution

### Monitoring & Observability
- **Metrics**: Request latency, error rates, throughput
- **Logging**: Structured logs with correlation IDs
- **Tracing**: Distributed tracing for request flows
- **Alerting**: Automated alerts for anomalies
- **Health Checks**: Endpoint availability monitoring

## Security Architecture

### Defense in Depth

1. **Network Layer**: HTTPS/TLS, firewall rules, DDoS protection
2. **Application Layer**: CSRF tokens, input validation, output encoding
3. **Data Layer**: Encryption at rest, encrypted connections, access controls
4. **Monitoring Layer**: Intrusion detection, audit logging, anomaly detection

### Security Best Practices

- **Input Validation**: Whitelist-based validation on all user input
- **Output Encoding**: Prevent XSS through proper encoding
- **Authentication**: Secure session management
- **Authorization**: Role-based access control (RBAC)
- **Secrets Management**: Environment variables, no hardcoded secrets
- **Dependency Scanning**: Regular updates and vulnerability checks

## Scalability Patterns

### Horizontal Scaling
- **Stateless Application Servers**: Enable multiple instances
- **Load Balancing**: Distribute traffic across instances
- **Database Replication**: Read replicas for query distribution
- **Cache Layer**: Redis for session and data caching

### Vertical Scaling
- **Resource Allocation**: Optimize CPU, memory, disk I/O
- **Database Optimization**: Query optimization, indexing
- **Code Optimization**: Profiling and performance tuning

## Future Architecture Considerations

### Potential Enhancements
1. **Microservices**: Split into user service, contact service, audit service
2. **Event-Driven**: Message queue (RabbitMQ, Kafka) for async processing
3. **GraphQL API**: Replace REST for more flexible data fetching
4. **Serverless Functions**: AWS Lambda for specific operations
5. **Multi-Region Deployment**: Geographic distribution for lower latency
6. **Advanced Analytics**: Real-time data processing and insights

## References

- **APM CLI Documentation**: [github/apm-cli](https://github.com/github/apm-cli)
- **AGENTS.md Standard**: [joggrdocs/agents.md](https://github.com/joggrdocs/agents.md)
- **Compliance Rules**: [danielmeppiel/compliance-rules](https://github.com/danielmeppiel/compliance-rules)
- **Design Guidelines**: [danielmeppiel/design-guidelines](https://github.com/danielmeppiel/design-guidelines)
- **GDPR Compliance**: [GDPR Official Text](https://gdpr-info.eu/)
- **WCAG 2.1 AA**: [W3C WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **FastAPI**: [FastAPI Documentation](https://fastapi.tiangolo.com/)
- **Vite**: [Vite Documentation](https://vitejs.dev/)

## Conclusion

The corporate website architecture demonstrates enterprise-grade development with automatic compliance and design enforcement through APM dependencies. Key innovations include:

1. **APM Context Optimization Engine**: Mathematical algorithms ensure optimal context distribution with 49.6% efficiency
2. **GDPR Compliance by Design**: Architectural patterns enforce privacy protection at every layer
3. **WCAG 2.1 AA Accessibility**: Design guidelines dependency ensures accessible UI components
4. **Universal Agent Compatibility**: Standard AGENTS.md output works with all major coding agents
5. **Modular Architecture**: Clear separation of concerns enables maintainability and scalability

This architecture serves as a reference implementation for enterprise projects requiring compliance, accessibility, and AI-native development workflows.
