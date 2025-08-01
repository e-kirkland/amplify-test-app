# Enneagram Discovery App - Project Specification

## Project Overview

### Purpose
Create an interactive mobile-first web application that guides users through a step-by-step survey to discover their Enneagram personality type. The application should be engaging, educational, and provide users with meaningful insights about their personality type.

### Technology Stack
- **Frontend**: Vite + React (TypeScript preferred)
- **Backend**: AWS Amplify
- **Deployment**: AWS Amplify Hosting
- **Authentication**: AWS Amplify Auth (supporting username/password, Google, Facebook, Apple)
- **Database**: AWS Amplify DataStore/DynamoDB
- **Testing**: Jest + React Testing Library
- **Mobile Optimization**: Progressive Web App (PWA) capabilities

### Target Platform
- Primary: Mobile devices (iOS/Android browsers)
- Secondary: Desktop browsers
- Responsive design with mobile-first approach

## Core Features

### 1. User Authentication
- **Multi-provider authentication** supporting:
  - Username/password registration and login
  - Google OAuth
  - Facebook OAuth
  - Apple Sign-In
- **User session management** with persistent login state
- **Password recovery** functionality
- **User profile management** (basic profile information)

### 2. Interactive Survey System
- **Step-by-step questionnaire** with 45-54 questions (5-6 questions per Enneagram type)
- **Progress tracking** with visual progress bar
- **Question types**:
  - Multiple choice (4-5 options per question)
  - Likert scale ratings (1-5 or 1-7)
  - Scenario-based questions with ranked preferences
- **Navigation features**:
  - Previous/Next question navigation
  - Save and resume survey capability
  - Question bookmarking for review

### 3. Results and Type Discovery
- **Enneagram type calculation** based on response scoring algorithm
- **Detailed type description** including:
  - Core motivations and fears
  - Strengths and growth areas
  - Relationship patterns
  - Career suggestions
  - Integration and disintegration paths
- **Visual type representation** with custom graphics/icons
- **Shareable results** (social media, PDF export)

### 4. User Data Management
- **Survey response storage** with user association
- **Result history** showing previous assessments
- **Progress persistence** for incomplete surveys
- **Data export** functionality for user data

### 5. Educational Content
- **Enneagram overview** explaining the system
- **Type comparison** features
- **Growth recommendations** based on user's type
- **Related content** and resources

## Technical Requirements

### Development Methodology
**Test-Driven Development (TDD) is mandatory for this project.**

1. **Write comprehensive unit tests FIRST** before implementing any functionality
2. **Implement code to make tests pass** - edit only implementation code, never tests
3. **Refactor only after tests pass** while maintaining test coverage
4. **Minimum 90% test coverage** across all components and utilities

### Testing Strategy
- **Unit Tests**: All components, utilities, and business logic
- **Integration Tests**: Authentication flows, survey completion, data persistence
- **E2E Tests**: Critical user journeys (registration → survey → results)
- **Accessibility Tests**: Screen reader compatibility, keyboard navigation
- **Performance Tests**: Mobile loading times, survey responsiveness

### Architecture Requirements

#### Frontend Structure
```
src/
├── components/
│   ├── auth/
│   ├── survey/
│   ├── results/
│   ├── common/
│   └── layout/
├── hooks/
├── services/
├── utils/
├── types/
├── constants/
├── __tests__/
└── assets/
```

#### Key Components to Test and Implement
- **AuthenticationProvider**: Manages auth state and methods
- **SurveyEngine**: Handles question flow and scoring logic
- **QuestionRenderer**: Displays different question types
- **ProgressTracker**: Manages and displays survey progress
- **ResultsCalculator**: Computes Enneagram type from responses
- **TypeDisplay**: Shows detailed type information
- **DataPersistence**: Handles user data storage and retrieval

### Data Models

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  username?: string;
  provider: 'cognito' | 'google' | 'facebook' | 'apple';
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Survey Response Model
```typescript
interface SurveyResponse {
  id: string;
  userId: string;
  responses: {
    questionId: string;
    answer: string | number;
    timestamp: Date;
  }[];
  isComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
  resultId?: string;
}
```

#### Enneagram Result Model
```typescript
interface EnneagramResult {
  id: string;
  userId: string;
  surveyResponseId: string;
  primaryType: number; // 1-9
  scores: {
    type: number;
    score: number;
  }[];
  wing?: number;
  calculatedAt: Date;
}
```

#### Question Model
```typescript
interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'likert' | 'ranking';
  options?: string[];
  targetTypes: number[]; // Which Enneagram types this question helps identify
  weight: number; // Scoring weight
  category: string; // Group questions by theme
}
```

### AWS Amplify Configuration

#### Authentication Setup
- Configure Amplify Auth with multiple providers
- Set up OAuth flows for Google, Facebook, Apple
- Configure user attributes and verification
- Implement forgot password flows

#### Data Storage
- Design GraphQL schema for user data, survey responses, and results
- Configure DataStore for offline capability
- Set up proper data access patterns and authorization rules
- Implement data synchronization

#### API Requirements
- **GraphQL mutations** for creating/updating survey responses
- **GraphQL queries** for retrieving user data and results
- **GraphQL subscriptions** for real-time progress updates (if needed)
- **REST endpoints** for file uploads (profile pictures, result exports)

### UI/UX Requirements

#### Mobile-First Design
- **Touch-friendly interfaces** with minimum 44px touch targets
- **Swipe gestures** for question navigation
- **Responsive typography** scaling appropriately
- **Fast loading** with skeleton screens and lazy loading
- **Offline capability** for survey completion

#### Accessibility
- **WCAG 2.1 AA compliance**
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** for all interactive elements
- **High contrast mode** support
- **Font size adjustment** capabilities

#### Visual Design
- **Modern, clean interface** with calming color palette
- **Progress visualization** showing survey completion status
- **Type-specific color coding** for different Enneagram types
- **Micro-interactions** for engagement (button animations, transitions)
- **Consistent iconography** throughout the application

## User Stories and Acceptance Criteria

### Epic 1: User Authentication
**As a user, I want to create an account and sign in so that my survey progress and results are saved.**

#### Story 1.1: Account Registration
- User can register with email/password
- User can register with Google, Facebook, or Apple
- User receives email verification (if using email/password)
- User profile is created upon successful registration

#### Story 1.2: User Login
- User can log in with existing credentials
- User can use social login options
- User sees appropriate error messages for failed attempts
- User remains logged in across sessions

### Epic 2: Survey Experience
**As a user, I want to complete an engaging survey that accurately determines my Enneagram type.**

#### Story 2.1: Survey Introduction
- User sees overview of the Enneagram system
- User understands what to expect from the survey
- User can start the survey when ready

#### Story 2.2: Question Flow
- User answers questions one at a time
- User can navigate between questions
- User sees progress indication
- User can save progress and resume later

#### Story 2.3: Survey Completion
- User completes all required questions
- User receives immediate results
- User can review their responses

### Epic 3: Results and Insights
**As a user, I want to understand my Enneagram type and learn how to apply this knowledge.**

#### Story 3.1: Type Revelation
- User discovers their primary Enneagram type
- User sees confidence scores for all types
- User receives explanation of their specific type

#### Story 3.2: Educational Content
- User learns about their type's characteristics
- User understands growth opportunities
- User can compare with other types

## Business Logic Requirements

### Scoring Algorithm
The AI agent must implement a comprehensive scoring system that:

1. **Weights questions appropriately** based on their discriminatory power
2. **Calculates scores for all 9 types** from each response
3. **Determines primary type** and potential wing
4. **Handles edge cases** where scores are very close
5. **Provides confidence metrics** for the results

### Question Database
Create a question bank that:
- **Covers all 9 Enneagram types** adequately
- **Uses validated psychological principles** for type identification
- **Avoids bias** toward any particular type
- **Includes variety in question formats** to maintain engagement
- **Balances question difficulty** from obvious to subtle

### Data Privacy and Security
- **Encrypt sensitive user data** at rest and in transit
- **Implement proper data retention** policies
- **Provide data export/deletion** capabilities
- **Follow GDPR/CCPA compliance** requirements
- **Secure API endpoints** with proper authentication

## Performance Requirements

### Loading Performance
- **Initial page load**: < 3 seconds on 3G
- **Question transitions**: < 500ms
- **Result calculation**: < 2 seconds
- **Image loading**: Progressive with placeholders

### Scalability
- **Support 1000+ concurrent users**
- **Handle 10,000+ completed surveys**
- **Efficient database queries** with proper indexing
- **CDN integration** for static assets

## Testing Requirements

### Unit Testing (Mandatory First Step)
Before implementing any component, write comprehensive unit tests covering:

#### Authentication Components
- Login/logout functionality
- Social authentication flows
- Error handling for auth failures
- Session persistence

#### Survey Components
- Question rendering for different types
- Answer collection and validation
- Progress tracking accuracy
- Navigation between questions

#### Scoring Logic
- Individual question scoring
- Type calculation algorithms
- Edge case handling (tied scores)
- Result accuracy validation

#### Data Persistence
- Survey response saving
- Progress restoration
- Result storage and retrieval
- Offline/online sync

### Integration Testing
- Complete user registration flow
- End-to-end survey completion
- Result calculation and display
- Data synchronization between devices

### Accessibility Testing
- Screen reader navigation
- Keyboard-only interaction
- Color contrast validation
- Focus management

## Development Phases

### Phase 1: Foundation (TDD Setup)
1. Write tests for authentication system
2. Implement AWS Amplify authentication
3. Write tests for basic survey infrastructure
4. Implement question rendering system
5. Write tests for data models
6. Implement data persistence layer

### Phase 2: Core Survey (TDD Implementation)
1. Write tests for scoring algorithm
2. Implement Enneagram scoring logic
3. Write tests for survey flow
4. Implement complete survey experience
5. Write tests for progress tracking
6. Implement save/resume functionality

### Phase 3: Results and Polish (TDD Completion)
1. Write tests for results calculation
2. Implement results display
3. Write tests for educational content
4. Implement type information pages
5. Write tests for sharing features
6. Implement result sharing and export

### Phase 4: Optimization and Launch
1. Performance optimization
2. Accessibility audit and fixes
3. Cross-browser testing
4. Security audit
5. Beta testing with real users

## Success Metrics

### Technical Metrics
- **Test coverage**: Minimum 90%
- **Performance**: All pages load < 3 seconds
- **Accessibility**: WCAG 2.1 AA compliance
- **Error rate**: < 1% unhandled errors

### User Experience Metrics
- **Survey completion rate**: > 80%
- **Result accuracy satisfaction**: > 85% user satisfaction
- **Return usage**: > 40% of users return within 30 days
- **Mobile usability**: > 4.5/5 mobile experience rating

## Implementation Guidelines for AI Agent

### Test-First Development Process
1. **Always write tests before implementation**
2. **Focus on behavior, not implementation details**
3. **Use descriptive test names** that explain expected behavior
4. **Group related tests** with describe blocks
5. **Mock external dependencies** appropriately
6. **Test edge cases and error conditions**

### Code Quality Standards
- **TypeScript strict mode** enabled
- **ESLint and Prettier** configuration
- **Consistent naming conventions** (camelCase for variables/functions, PascalCase for components)
- **Proper error handling** with user-friendly messages
- **Component composition** over inheritance
- **Custom hooks** for reusable stateful logic

### AWS Amplify Best Practices
- **Use Amplify CLI** for consistent configuration
- **Follow Amplify DataStore patterns** for data management
- **Implement proper error boundaries** for API failures
- **Use Amplify UI components** where appropriate
- **Configure proper IAM roles** and permissions

### Mobile Optimization Requirements
- **Touch targets** minimum 44px
- **Viewport meta tag** properly configured
- **Hardware acceleration** for animations
- **Lazy loading** for images and components
- **Service worker** for offline capability
- **App manifest** for PWA installation

## Constraints and Considerations

### Technical Constraints
- Must work within AWS Amplify ecosystem
- Must support modern mobile browsers (iOS Safari 14+, Chrome 90+)
- Must handle intermittent connectivity gracefully
- Must comply with app store guidelines if wrapped as native app

### Business Constraints
- Free tier usage should accommodate initial user base
- Scalable architecture for potential growth
- Compliance with data privacy regulations
- Educational content should be scientifically accurate

### User Experience Constraints
- Survey completion time should be 10-15 minutes
- Results should feel personalized and accurate
- Educational content should be accessible to general audience
- Interface should feel modern and trustworthy

## Deliverables Checklist

### Code Deliverables
- [ ] Complete React application with TypeScript
- [ ] AWS Amplify configuration files
- [ ] Comprehensive test suite (90%+ coverage)
- [ ] Documentation for setup and deployment
- [ ] Component storybook for UI components

### Documentation Deliverables
- [ ] API documentation for all endpoints
- [ ] User guide for application features
- [ ] Developer guide for future maintenance
- [ ] Deployment and configuration guide
- [ ] Testing strategy documentation

### Quality Assurance Deliverables
- [ ] Test coverage reports
- [ ] Performance audit results
- [ ] Accessibility compliance report
- [ ] Security assessment
- [ ] Cross-browser compatibility report

## AI Agent Instructions

When implementing this specification:

1. **START WITH TESTS**: Before writing any component or utility, write comprehensive unit tests that define the expected behavior.

2. **RED-GREEN-REFACTOR**: Follow the TDD cycle strictly:
   - Write failing tests (RED)
   - Write minimal code to pass tests (GREEN)
   - Refactor while keeping tests green (REFACTOR)

3. **TEST CATEGORIES**: Ensure you write tests for:
   - Component rendering and props
   - User interactions (clicks, form submissions)
   - State management and updates
   - API calls and error handling
   - Utility functions and calculations
   - Integration between components

4. **IMPLEMENTATION PRIORITY**:
   - Authentication system with tests
   - Data models and persistence with tests
   - Basic survey infrastructure with tests
   - Question rendering and navigation with tests
   - Scoring algorithm with comprehensive tests
   - Results display with tests
   - Polish and optimization

5. **AVOID BLOAT**: Only implement features explicitly mentioned in this spec. Ask for clarification before adding additional features.

6. **MOBILE FOCUS**: Every component must be tested and implemented with mobile-first responsive design.

7. **ERROR HANDLING**: Write tests for error scenarios and implement graceful error handling throughout the application.

Remember: The goal is a production-ready, well-tested application that provides real value to users seeking to understand their Enneagram type through an engaging, mobile-optimized experience.