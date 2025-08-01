# Enneagram Discovery App - Code Style Guide

## Table of Contents
- [Philosophy](#philosophy)
- [Project Structure](#project-structure)
- [TypeScript Guidelines](#typescript-guidelines)
- [Component Architecture](#component-architecture)
- [Business Logic Abstraction](#business-logic-abstraction)
- [Service Layer & Adapters](#service-layer--adapters)
- [State Management](#state-management)
- [Testing Standards](#testing-standards)
- [Documentation Standards](#documentation-standards)
- [Error Handling](#error-handling)
- [Performance Guidelines](#performance-guidelines)
- [Code Examples](#code-examples)

## Philosophy

### Core Principles
1. **Clarity over Cleverness**: Code should be self-documenting and readable by any developer
2. **Separation of Concerns**: Business logic, UI components, and data access should be clearly separated
3. **Modularity First**: Every piece of functionality should be reusable and testable in isolation
4. **Composition over Inheritance**: Favor composition patterns and functional approaches
5. **Fail Fast**: Use TypeScript's type system to catch errors at compile time
6. **Progressive Enhancement**: Build for mobile first, progressively enhance for desktop

### Code Quality Hierarchy
1. **Correctness**: Code must work as intended
2. **Clarity**: Code must be readable and understandable
3. **Maintainability**: Code must be easy to modify and extend
4. **Performance**: Code should be efficient without sacrificing clarity

## Project Structure

### Directory Organization
```
src/
├── components/           # React components (presentation layer)
│   ├── auth/            # Authentication-related components
│   ├── survey/          # Survey-specific components
│   ├── results/         # Results display components
│   ├── common/          # Reusable UI components
│   └── layout/          # Layout and navigation components
├── hooks/               # Custom React hooks
├── services/            # External service adapters (AWS, API calls)
├── domain/              # Business logic and domain models
│   ├── models/          # TypeScript interfaces and types
│   ├── repositories/    # Data access abstractions
│   ├── use-cases/       # Business logic use cases
│   └── validators/      # Input validation logic
├── utils/               # Pure utility functions
├── constants/           # Application constants and configurations
├── types/               # Global TypeScript type definitions
├── __tests__/           # Test files organized by feature
├── assets/              # Static assets (images, fonts, etc.)
└── styles/              # Global styles and theme definitions
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `SurveyQuestion.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useEnneagramScoring.ts`)
- **Services**: camelCase with service suffix (e.g., `authService.ts`)
- **Types**: PascalCase with type suffix (e.g., `UserType.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Test files**: Match source file with `.test.` or `.spec.` (e.g., `SurveyQuestion.test.tsx`)

## TypeScript Guidelines

### Type Definitions
```typescript
// ✅ Good: Descriptive interface names with clear purpose
interface EnneagramSurveyQuestion {
  readonly id: string;
  readonly text: string;
  readonly type: QuestionType;
  readonly options: readonly string[];
  readonly targetTypes: readonly EnneagramType[];
  readonly metadata: QuestionMetadata;
}

// ✅ Good: Use discriminated unions for type safety
type QuestionType = 
  | 'multiple-choice'
  | 'likert-scale'
  | 'ranking';

// ✅ Good: Use branded types for domain-specific values
type UserId = string & { readonly brand: unique symbol };
type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// ❌ Bad: Generic names without context
interface Data {
  id: string;
  value: any;
}
```

### Generic Constraints
```typescript
// ✅ Good: Constrained generics with clear bounds
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// ✅ Good: Use utility types for transformation
type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserRequest = Partial<Pick<User, 'firstName' | 'lastName'>>;
```

### Function Signatures
```typescript
// ✅ Good: Explicit return types and parameter constraints
function calculateEnneagramScores(
  responses: readonly SurveyResponse[],
  questions: readonly EnneagramSurveyQuestion[]
): Promise<EnneagramScoreResult> {
  // Implementation
}

// ✅ Good: Use function overloads for different use cases
function formatScore(score: number): string;
function formatScore(score: number, includePercentage: true): string;
function formatScore(score: number, includePercentage?: boolean): string {
  // Implementation
}
```

## Component Architecture

### Component Structure
```typescript
// ✅ Good: Well-structured component with clear separation
import React, { memo } from 'react';
import { QuestionProps, QuestionAnswer } from './types';
import { useQuestionValidation } from './hooks';
import { cn } from '@/utils/classNames';

/**
 * Renders a single survey question with answer options.
 * Handles user input and validation for different question types.
 * 
 * @param question - The question data to render
 * @param onAnswer - Callback fired when user selects an answer
 * @param className - Additional CSS classes to apply
 */
interface SurveyQuestionProps {
  readonly question: EnneagramSurveyQuestion;
  readonly currentAnswer?: QuestionAnswer;
  readonly onAnswer: (answer: QuestionAnswer) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export const SurveyQuestion = memo<SurveyQuestionProps>(({
  question,
  currentAnswer,
  onAnswer,
  disabled = false,
  className
}) => {
  // Custom hooks for component logic
  const { validateAnswer, errors } = useQuestionValidation(question);
  
  // Event handlers
  const handleAnswerSelect = useCallback((answer: QuestionAnswer) => {
    if (disabled) return;
    
    const validationResult = validateAnswer(answer);
    if (validationResult.isValid) {
      onAnswer(answer);
    }
  }, [disabled, validateAnswer, onAnswer]);

  // Render helpers for different question types
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion 
          question={question} 
          currentAnswer={currentAnswer}
          onSelect={handleAnswerSelect}
          disabled={disabled}
        />;
      case 'likert-scale':
        return <LikertScaleQuestion 
          question={question}
          currentAnswer={currentAnswer}
          onSelect={handleAnswerSelect}
          disabled={disabled}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('survey-question', className)} data-testid="survey-question">
      <QuestionHeader question={question} />
      {renderQuestionContent()}
      {errors.length > 0 && <QuestionErrors errors={errors} />}
    </div>
  );
});

SurveyQuestion.displayName = 'SurveyQuestion';
```

### Component Composition Patterns
```typescript
// ✅ Good: Composition with render props
interface SurveyProviderProps {
  children: (state: SurveyState, actions: SurveyActions) => React.ReactNode;
}

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(surveyReducer, initialState);
  const actions = useMemo(() => createSurveyActions(dispatch), [dispatch]);
  
  return children(state, actions);
};

// Usage
<SurveyProvider>
  {(state, actions) => (
    <SurveyQuestion 
      question={state.currentQuestion}
      onAnswer={actions.submitAnswer}
    />
  )}
</SurveyProvider>
```

### Custom Hooks Pattern
```typescript
// ✅ Good: Custom hook with clear responsibility
/**
 * Hook for managing survey progression and state.
 * Handles question navigation, answer storage, and progress calculation.
 */
export function useSurveyProgression(surveyId: string) {
  const [state, setState] = useState<SurveyProgressionState>(() => 
    createInitialState(surveyId)
  );
  
  const actions = useMemo(() => ({
    nextQuestion: () => setState(prev => progressToNext(prev)),
    previousQuestion: () => setState(prev => progressToPrevious(prev)),
    submitAnswer: (answer: QuestionAnswer) => 
      setState(prev => recordAnswer(prev, answer)),
    jumpToQuestion: (questionIndex: number) => 
      setState(prev => jumpToIndex(prev, questionIndex))
  }), []);

  const selectors = useMemo(() => ({
    currentQuestion: getCurrentQuestion(state),
    progressPercentage: calculateProgress(state),
    canGoNext: canProgressNext(state),
    canGoPrevious: canProgressPrevious(state)
  }), [state]);

  return { state, actions, selectors };
}
```

## Business Logic Abstraction

### Domain Models
```typescript
// ✅ Good: Rich domain models with behavior
export class EnneagramResult {
  constructor(
    private readonly _scores: ReadonlyMap<EnneagramType, number>,
    private readonly _metadata: ResultMetadata
  ) {}

  get primaryType(): EnneagramType {
    return this.getHighestScoringType();
  }

  get wing(): EnneagramType | null {
    return this.calculateWing();
  }

  get confidenceLevel(): ConfidenceLevel {
    return this.calculateConfidence();
  }

  /**
   * Determines if the result has a clear primary type
   * or if scores are too close to be confident.
   */
  hasConfidentResult(): boolean {
    const sortedScores = this.getSortedScores();
    const [highest, secondHighest] = sortedScores;
    const scoreDifference = highest.score - secondHighest.score;
    
    return scoreDifference >= CONFIDENCE_THRESHOLD;
  }

  /**
   * Gets detailed analysis of all type scores
   * for educational purposes.
   */
  getDetailedAnalysis(): TypeAnalysis {
    return {
      primaryType: this.primaryType,
      wing: this.wing,
      allScores: this._scores,
      strengthAreas: this.getStrengthAreas(),
      growthAreas: this.getGrowthAreas(),
      relatedTypes: this.getRelatedTypes()
    };
  }

  private getHighestScoringType(): EnneagramType {
    return [...this._scores.entries()]
      .reduce((highest, [type, score]) => 
        score > highest.score ? { type, score } : highest
      ).type;
  }

  private calculateWing(): EnneagramType | null {
    // Implementation details...
  }
}
```

### Use Cases (Business Logic)
```typescript
// ✅ Good: Use case with clear single responsibility
/**
 * Use case for calculating Enneagram type from survey responses.
 * Encapsulates the business rules for scoring and type determination.
 */
export class CalculateEnneagramTypeUseCase {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly scoringService: EnneagramScoringService,
    private readonly logger: Logger
  ) {}

  /**
   * Calculates the user's Enneagram type based on their survey responses.
   * 
   * @param responses - User's answers to survey questions
   * @returns Promise resolving to calculated Enneagram result
   * @throws {InvalidResponsesError} When responses are incomplete or invalid
   * @throws {ScoringError} When scoring calculation fails
   */
  async execute(responses: readonly SurveyResponse[]): Promise<EnneagramResult> {
    this.logger.info('Starting Enneagram type calculation', { 
      responseCount: responses.length 
    });

    // Validate inputs
    const validation = await this.validateResponses(responses);
    if (!validation.isValid) {
      throw new InvalidResponsesError(validation.errors);
    }

    try {
      // Get questions for scoring context
      const questions = await this.questionRepository.findByIds(
        responses.map(r => r.questionId)
      );

      // Calculate raw scores
      const rawScores = await this.scoringService.calculateRawScores(
        responses, 
        questions
      );

      // Apply scoring algorithms and business rules
      const normalizedScores = this.scoringService.normalizeScores(rawScores);
      const result = new EnneagramResult(normalizedScores, {
        calculatedAt: new Date(),
        version: SCORING_ALGORITHM_VERSION,
        confidence: this.calculateConfidenceMetrics(normalizedScores)
      });

      this.logger.info('Enneagram calculation completed', {
        primaryType: result.primaryType,
        confidence: result.confidenceLevel
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to calculate Enneagram type', { error });
      throw new ScoringError('Unable to calculate type from responses', error);
    }
  }

  private async validateResponses(
    responses: readonly SurveyResponse[]
  ): Promise<ValidationResult> {
    // Validation logic...
  }
}
```

### Repository Pattern
```typescript
// ✅ Good: Abstract repository interface
export interface SurveyResponseRepository {
  save(response: SurveyResponse): Promise<SurveyResponse>;
  findByUserId(userId: UserId): Promise<readonly SurveyResponse[]>;
  findIncompleteByUserId(userId: UserId): Promise<SurveyResponse | null>;
  updateResponse(id: string, updates: Partial<SurveyResponse>): Promise<SurveyResponse>;
  deleteByUserId(userId: UserId): Promise<void>;
}

// ✅ Good: Concrete implementation with adapter pattern
export class AmplifyDataStoreSurveyResponseRepository implements SurveyResponseRepository {
  constructor(
    private readonly dataStore: AmplifyDataStoreAdapter,
    private readonly mapper: SurveyResponseMapper,
    private readonly logger: Logger
  ) {}

  async save(response: SurveyResponse): Promise<SurveyResponse> {
    this.logger.debug('Saving survey response', { id: response.id });
    
    try {
      const dataStoreModel = this.mapper.toDataStoreModel(response);
      const saved = await this.dataStore.save(SurveyResponseModel, dataStoreModel);
      return this.mapper.toDomainModel(saved);
    } catch (error) {
      this.logger.error('Failed to save survey response', { error, id: response.id });
      throw new RepositoryError('Failed to save survey response', error);
    }
  }

  async findByUserId(userId: UserId): Promise<readonly SurveyResponse[]> {
    try {
      const models = await this.dataStore.query(
        SurveyResponseModel,
        c => c.userId.eq(userId)
      );
      return models.map(model => this.mapper.toDomainModel(model));
    } catch (error) {
      this.logger.error('Failed to find responses by user ID', { error, userId });
      throw new RepositoryError('Failed to retrieve user responses', error);
    }
  }
}
```

## Service Layer & Adapters

### Service Interfaces
```typescript
// ✅ Good: Clear service boundaries with dependency injection
export interface AuthenticationService {
  signIn(credentials: SignInCredentials): Promise<AuthResult>;
  signUp(registration: SignUpRequest): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(): Promise<AuthResult>;
}

export interface NotificationService {
  showSuccess(message: string): void;
  showError(error: Error): void;
  showInfo(message: string): void;
}

export interface StorageService {
  store<T>(key: string, value: T): Promise<void>;
  retrieve<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

### Service Implementation with Adapters
```typescript
// ✅ Good: Service implementation with proper error handling and logging
export class AmplifyAuthenticationService implements AuthenticationService {
  constructor(
    private readonly amplifyAuth: AmplifyAuthAdapter,
    private readonly userMapper: UserMapper,
    private readonly logger: Logger,
    private readonly eventBus: EventBus
  ) {}

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    this.logger.info('Attempting user sign in', { 
      provider: credentials.provider,
      email: credentials.email 
    });

    try {
      const authResponse = await this.amplifyAuth.signIn(credentials);
      const user = this.userMapper.fromAuthResponse(authResponse);
      
      // Emit domain event
      this.eventBus.emit(new UserSignedInEvent(user));
      
      this.logger.info('User signed in successfully', { userId: user.id });
      
      return {
        success: true,
        user,
        token: authResponse.accessToken
      };
    } catch (error) {
      this.logger.error('Sign in failed', { error, email: credentials.email });
      
      // Transform service-specific errors to domain errors
      if (error instanceof AmplifyUserNotConfirmedException) {
        throw new UserNotConfirmedError('Please verify your email address');
      }
      
      if (error instanceof AmplifyInvalidCredentialsException) {
        throw new InvalidCredentialsError('Invalid email or password');
      }
      
      throw new AuthenticationError('Unable to sign in at this time', error);
    }
  }
}

// ✅ Good: Adapter pattern for external services
export class AmplifyAuthAdapter {
  constructor(private readonly amplify: typeof Auth) {}

  async signIn(credentials: SignInCredentials): Promise<CognitoUser> {
    switch (credentials.provider) {
      case 'cognito':
        return this.amplify.signIn(credentials.email, credentials.password);
      case 'google':
        return this.amplify.federatedSignIn({ provider: 'Google' });
      case 'facebook':
        return this.amplify.federatedSignIn({ provider: 'Facebook' });
      case 'apple':
        return this.amplify.federatedSignIn({ provider: 'SignInWithApple' });
      default:
        throw new Error(`Unsupported auth provider: ${credentials.provider}`);
    }
  }
}
```

### Configuration and Dependency Injection
```typescript
// ✅ Good: Service composition with dependency injection
export class ServiceContainer {
  private services = new Map<string, any>();

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Infrastructure services
    const logger = new ConsoleLogger();
    const eventBus = new EventBus();
    
    // Adapters
    const amplifyAuth = new AmplifyAuthAdapter(Auth);
    const amplifyDataStore = new AmplifyDataStoreAdapter(DataStore);
    
    // Mappers
    const userMapper = new UserMapper();
    const surveyResponseMapper = new SurveyResponseMapper();
    
    // Services
    const authService = new AmplifyAuthenticationService(
      amplifyAuth,
      userMapper,
      logger,
      eventBus
    );
    
    const surveyRepository = new AmplifyDataStoreSurveyResponseRepository(
      amplifyDataStore,
      surveyResponseMapper,
      logger
    );
    
    // Register services
    this.register('logger', logger);
    this.register('authService', authService);
    this.register('surveyRepository', surveyRepository);
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service;
  }
}
```

## State Management

### React Context with Reducers
```typescript
// ✅ Good: Typed reducer with clear action types
type SurveyAction =
  | { type: 'LOAD_SURVEY'; payload: { questions: readonly EnneagramSurveyQuestion[] } }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: QuestionAnswer } }
  | { type: 'NAVIGATE_TO_QUESTION'; payload: { index: number } }
  | { type: 'SUBMIT_SURVEY'; payload: { responses: readonly SurveyResponse[] } }
  | { type: 'SET_ERROR'; payload: { error: Error } }
  | { type: 'CLEAR_ERROR' };

interface SurveyState {
  readonly questions: readonly EnneagramSurveyQuestion[];
  readonly responses: ReadonlyMap<string, QuestionAnswer>;
  readonly currentQuestionIndex: number;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly isSubmitted: boolean;
}

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'LOAD_SURVEY':
      return {
        ...state,
        questions: action.payload.questions,
        isLoading: false,
        error: null
      };
      
    case 'ANSWER_QUESTION':
      return {
        ...state,
        responses: new Map(state.responses).set(
          action.payload.questionId,
          action.payload.answer
        )
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false
      };
      
    default:
      return state;
  }
}

// ✅ Good: Context provider with actions
export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(surveyReducer, initialSurveyState);
  
  const actions = useMemo(() => ({
    loadSurvey: (questions: readonly EnneagramSurveyQuestion[]) =>
      dispatch({ type: 'LOAD_SURVEY', payload: { questions } }),
    
    answerQuestion: (questionId: string, answer: QuestionAnswer) =>
      dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer } }),
    
    navigateToQuestion: (index: number) =>
      dispatch({ type: 'NAVIGATE_TO_QUESTION', payload: { index } })
  }), []);

  return (
    <SurveyContext.Provider value={{ state, actions }}>
      {children}
    </SurveyContext.Provider>
  );
};
```

## Testing Standards

### Unit Test Structure
```typescript
// ✅ Good: Well-structured test with clear arrange/act/assert
describe('CalculateEnneagramTypeUseCase', () => {
  let useCase: CalculateEnneagramTypeUseCase;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockScoringService: jest.Mocked<EnneagramScoringService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockQuestionRepository = createMockQuestionRepository();
    mockScoringService = createMockScoringService();
    mockLogger = createMockLogger();
    
    useCase = new CalculateEnneagramTypeUseCase(
      mockQuestionRepository,
      mockScoringService,
      mockLogger
    );
  });

  describe('when calculating type from valid responses', () => {
    it('should return correct Enneagram result with primary type', async () => {
      // Arrange
      const responses = createValidSurveyResponses();
      const questions = createMockQuestions();
      const expectedScores = new Map([[1, 85], [2, 70], [3, 60]]);
      
      mockQuestionRepository.findByIds.mockResolvedValue(questions);
      mockScoringService.calculateRawScores.mockResolvedValue(expectedScores);
      mockScoringService.normalizeScores.mockReturnValue(expectedScores);

      // Act
      const result = await useCase.execute(responses);

      // Assert
      expect(result.primaryType).toBe(1);
      expect(result.hasConfidentResult()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Enneagram calculation completed',
        expect.objectContaining({ primaryType: 1 })
      );
    });

    it('should handle edge case when scores are too close for confidence', async () => {
      // Arrange
      const responses = createValidSurveyResponses();
      const questions = createMockQuestions();
      const closeScores = new Map([[1, 75], [2, 74], [3, 60]]);
      
      mockQuestionRepository.findByIds.mockResolvedValue(questions);
      mockScoringService.calculateRawScores.mockResolvedValue(closeScores);
      mockScoringService.normalizeScores.mockReturnValue(closeScores);

      // Act
      const result = await useCase.execute(responses);

      // Assert
      expect(result.hasConfidentResult()).toBe(false);
      expect(result.confidenceLevel).toBe('low');
    });
  });

  describe('when responses are invalid', () => {
    it('should throw InvalidResponsesError for incomplete responses', async () => {
      // Arrange
      const incompleteResponses = createIncompleteResponses();

      // Act & Assert
      await expect(useCase.execute(incompleteResponses))
        .rejects
        .toThrow(InvalidResponsesError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to calculate Enneagram type',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });
});
```

### Component Testing
```typescript
// ✅ Good: Component test with user interaction testing
describe('SurveyQuestion', () => {
  const defaultProps: SurveyQuestionProps = {
    question: createMockMultipleChoiceQuestion(),
    onAnswer: jest.fn(),
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render question text and options correctly', () => {
    // Arrange & Act
    render(<SurveyQuestion {...defaultProps} />);

    // Assert
    expect(screen.getByText(defaultProps.question.text)).toBeInTheDocument();
    defaultProps.question.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('should call onAnswer when user selects an option', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SurveyQuestion {...defaultProps} />);

    // Act
    await user.click(screen.getByText(defaultProps.question.options[0]));

    // Assert
    expect(defaultProps.onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: defaultProps.question.id,
        answer: defaultProps.question.options[0]
      })
    );
  });

  it('should not allow interaction when disabled', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SurveyQuestion {...defaultProps} disabled={true} />);

    // Act
    await user.click(screen.getByText(defaultProps.question.options[0]));

    // Assert
    expect(defaultProps.onAnswer).not.toHaveBeenCalled();
  });

  it('should display validation errors when answer is invalid', async () => {
    // Arrange
    const invalidQuestion = createInvalidQuestion();
    render(<SurveyQuestion {...defaultProps} question={invalidQuestion} />);

    // Act
    const user = userEvent.setup();
    await user.click(screen.getByText('Invalid Option'));

    // Assert
    expect(screen.getByText('Please select a valid option')).toBeInTheDocument();
    expect(defaultProps.onAnswer).not.toHaveBeenCalled();
  });
});
```

## Documentation Standards

### Function Documentation
```typescript
/**
 * Calculates the wing type for an Enneagram result based on adjacent type scores.
 * 
 * Wings are the two types on either side of the core type that can influence
 * personality expression. This function determines which wing is stronger based
 * on scoring patterns and established Enneagram theory.
 * 
 * @param primaryType - The user's core Enneagram type (1-9)
 * @param allScores - Map of all type scores from the assessment
 * @param threshold - Minimum score difference required for wing determination
 * @returns The dominant wing type, or null if no clear wing emerges
 * 
 * @example
 * ```typescript
 * const scores = new Map([[1, 85], [2, 40], [9, 60]]);
 * const wing = calculateWingType(1, scores, 10);
 * console.log(wing); // 9 (since 60 > 40 + threshold)
 * ```
 * 
 * @throws {InvalidTypeError} When primaryType is not between 1-9
 * @throws {InsufficientDataError} When allScores doesn't contain required types
 */
export function calculateWingType(
  primaryType: EnneagramType,
  allScores: ReadonlyMap<EnneagramType, number>,
  threshold: number = WING_THRESHOLD
): EnneagramType | null {
  // Implementation...
}
```

### Component Documentation
```typescript
/**
 * Interactive survey question component that handles different question types
 * and user input validation for the Enneagram assessment.
 * 
 * This component is responsible for:
 * - Rendering question content based on question type
 * - Managing user input and validation
 * - Providing accessibility features (ARIA labels, keyboard navigation)
 * - Displaying validation errors and feedback
 * 
 * @component
 * @example
 * ```tsx
 * <SurveyQuestion
 *   question={multipleChoiceQuestion}
 *   currentAnswer={userAnswer}
 *   onAnswer={(answer) => handleAnswerChange(answer)}
 *   disabled={isSubmitting}
 * />
 * ```
 */
interface SurveyQuestionProps {
  /** The question data to render, including text, options, and metadata */
  readonly question: EnneagramSurveyQuestion;
  
  /** Current user answer, if any */
  readonly currentAnswer?: QuestionAnswer;
  
  /** Callback fired when user selects or changes their answer */
  readonly onAnswer: (answer: QuestionAnswer) => void;
  
  /** Whether the question should be disabled for interaction */
  readonly disabled?: boolean;
  
  /** Additional CSS classes to apply to the component */
  readonly className?: string;
}
```

### README Documentation
```markdown
# Survey Question Component

## Overview
The `SurveyQuestion` component renders interactive survey questions for the Enneagram assessment. It supports multiple question types and provides comprehensive validation and accessibility features.

## Features
- ✅ Multiple choice questions with single selection
- ✅ Likert scale questions with rating selection
- ✅ Input validation with clear error messaging
- ✅ Full keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Mobile-optimized touch targets

## Usage
\`\`\`tsx
import { SurveyQuestion } from '@/components/survey';

function SurveyPage() {
  const [currentAnswer, setCurrentAnswer] = useState<QuestionAnswer>();
  
  return (
    <SurveyQuestion
      question={currentQuestion}
      currentAnswer={currentAnswer}
      onAnswer={setCurrentAnswer}
      disabled={isSubmitting}
    />
  );
}
\`\`\`

## Testing
See `SurveyQuestion.test.tsx` for comprehensive test examples covering:
- Rendering different question types
- User interaction flows
- Validation error handling
- Accessibility compliance
```

## Error Handling

### Error Hierarchy
```typescript
// ✅ Good: Domain-specific error hierarchy
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  
  constructor(
    message: string,
    public readonly field: string,
    public readonly invalidValue: unknown,
    cause?: Error
  ) {
    super(message, cause, { field, invalidValue });
  }
  
  get userMessage(): string {
    return `Please check your input for ${this.field}`;
  }
}

export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
  
  get userMessage(): string {
    return 'Please check your login credentials and try again';
  }
}

export class ScoringError extends DomainError {
  readonly code = 'SCORING_ERROR';
  
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
  
  get userMessage(): string {
    return 'Unable to calculate your results. Please try again or contact support';
  }
}
```

### Error Boundaries
```typescript
// ✅ Good: Error boundary with comprehensive error handling
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SurveyErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Log error with context
    logger.error('Survey component error boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Report to error tracking service
    if (error instanceof DomainError) {
      errorReportingService.reportDomainError(error);
    } else {
      errorReportingService.reportUnexpectedError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// ✅ Good: User-friendly error fallback component
interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  showDetails?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showDetails = false
}) => {
  const getUserMessage = (error: Error | null): string => {
    if (!error) return 'An unexpected error occurred';
    
    if (error instanceof DomainError) {
      return error.userMessage;
    }
    
    return 'Something went wrong. Please try again';
  };

  return (
    <div className="error-boundary" role="alert" aria-live="assertive">
      <div className="error-content">
        <h2>Oops! Something went wrong</h2>
        <p>{getUserMessage(error)}</p>
        
        <div className="error-actions">
          <button 
            onClick={resetError}
            className="btn-primary"
            aria-label="Try again"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
        
        {showDetails && error && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
};
```

### Async Error Handling
```typescript
// ✅ Good: Async operation with comprehensive error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Log the error with context
    logger.error(`Error in ${context}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString()
    });

    // Transform known errors to domain errors
    if (error instanceof NetworkError) {
      throw new ServiceUnavailableError(
        `Unable to complete ${context} due to network issues`,
        error
      );
    }

    if (error instanceof ValidationError) {
      throw error; // Re-throw domain errors as-is
    }

    // Wrap unknown errors
    throw new UnexpectedError(
      `An unexpected error occurred during ${context}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Usage in service methods
export class SurveyService {
  async submitSurveyResponse(response: SurveyResponse): Promise<void> {
    return withErrorHandling(async () => {
      const validation = await this.validateResponse(response);
      if (!validation.isValid) {
        throw new ValidationError(
          'Survey response validation failed',
          'responses',
          response
        );
      }

      await this.repository.save(response);
      await this.notificationService.showSuccess('Survey saved successfully');
    }, 'survey submission');
  }
}
```

## Performance Guidelines

### Component Optimization
```typescript
// ✅ Good: Optimized component with memoization
interface SurveyQuestionListProps {
  questions: readonly EnneagramSurveyQuestion[];
  responses: ReadonlyMap<string, QuestionAnswer>;
  onAnswerChange: (questionId: string, answer: QuestionAnswer) => void;
}

export const SurveyQuestionList = memo<SurveyQuestionListProps>(({
  questions,
  responses,
  onAnswerChange
}) => {
  // Memoize callback to prevent unnecessary re-renders
  const handleAnswerChange = useCallback((questionId: string) => 
    (answer: QuestionAnswer) => onAnswerChange(questionId, answer),
    [onAnswerChange]
  );

  // Memoize expensive calculations
  const questionStats = useMemo(() => 
    calculateQuestionStatistics(questions, responses),
    [questions, responses]
  );

  // Virtual scrolling for large question lists
  const [visibleRange, setVisibleRange] = useVirtualScrolling({
    itemCount: questions.length,
    itemHeight: QUESTION_HEIGHT,
    containerHeight: CONTAINER_HEIGHT
  });

  return (
    <div className="survey-question-list" style={{ height: CONTAINER_HEIGHT }}>
      <div style={{ height: visibleRange.startOffset }} />
      
      {questions.slice(visibleRange.start, visibleRange.end).map((question) => (
        <SurveyQuestion
          key={question.id}
          question={question}
          currentAnswer={responses.get(question.id)}
          onAnswer={handleAnswerChange(question.id)}
        />
      ))}
      
      <div style={{ height: visibleRange.endOffset }} />
    </div>
  );
});

SurveyQuestionList.displayName = 'SurveyQuestionList';
```

### Data Fetching Optimization
```typescript
// ✅ Good: Optimized data fetching with caching
export class OptimizedSurveyRepository implements SurveyRepository {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly dataStore: AmplifyDataStoreAdapter,
    private readonly logger: Logger
  ) {}

  async findSurveyQuestions(): Promise<readonly EnneagramSurveyQuestion[]> {
    const cacheKey = 'survey-questions';
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug('Returning cached survey questions');
      return cached.data;
    }

    // Fetch fresh data
    const questions = await this.dataStore.query(SurveyQuestionModel);
    const domainQuestions = questions.map(q => this.mapper.toDomainModel(q));
    
    // Update cache
    this.cache.set(cacheKey, {
      data: domainQuestions,
      timestamp: Date.now()
    });

    return domainQuestions;
  }

  // Prefetch related data to reduce waterfall requests
  async prefetchSurveyData(userId: string): Promise<void> {
    const prefetchTasks = [
      this.findSurveyQuestions(),
      this.findUserResponses(userId),
      this.findUserProfile(userId)
    ];

    // Run prefetch tasks in parallel
    await Promise.allSettled(prefetchTasks);
    this.logger.info('Survey data prefetch completed');
  }
}
```

### Bundle Optimization
```typescript
// ✅ Good: Code splitting and lazy loading
// Lazy load heavy components
const EnneagramResultsPage = lazy(() => 
  import('./pages/EnneagramResultsPage').then(module => ({
    default: module.EnneagramResultsPage
  }))
);

const SurveyAnalyticsPage = lazy(() => 
  import('./pages/SurveyAnalyticsPage').then(module => ({
    default: module.SurveyAnalyticsPage
  }))
);

// Route-based code splitting
export const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoadingSpinner />}>
    <Routes>
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/results" element={<EnneagramResultsPage />} />
      <Route path="/analytics" element={<SurveyAnalyticsPage />} />
    </Routes>
  </Suspense>
);

// Dynamic imports for heavy utilities
const loadChartingLibrary = () => 
  import('recharts').then(charts => charts);

const loadPDFGenerator = () => 
  import('jspdf').then(pdf => pdf.default);
```

## Code Examples

### Complete Feature Implementation Example
```typescript
// Domain Model
export class SurveySession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    private _responses: Map<string, QuestionAnswer>,
    private _currentQuestionIndex: number = 0,
    public readonly startedAt: Date = new Date()
  ) {}

  get responses(): ReadonlyMap<string, QuestionAnswer> {
    return this._responses;
  }

  get currentQuestionIndex(): number {
    return this._currentQuestionIndex;
  }

  get isComplete(): boolean {
    return this._responses.size >= REQUIRED_RESPONSE_COUNT;
  }

  /**
   * Records an answer for a specific question.
   * Updates the current question index if this is a new response.
   */
  recordAnswer(questionId: string, answer: QuestionAnswer): void {
    const wasNewResponse = !this._responses.has(questionId);
    this._responses.set(questionId, answer);
    
    if (wasNewResponse && this.canProgressNext()) {
      this._currentQuestionIndex++;
    }
  }

  /**
   * Navigates to a specific question by index.
   * Validates that the target question is accessible.
   */
  navigateToQuestion(index: number): void {
    if (index < 0 || index >= TOTAL_QUESTION_COUNT) {
      throw new NavigationError(`Question index ${index} is out of bounds`);
    }
    
    if (index > this.getMaxAccessibleQuestionIndex()) {
      throw new NavigationError(`Cannot navigate to unanswered question ${index}`);
    }
    
    this._currentQuestionIndex = index;
  }

  private canProgressNext(): boolean {
    return this._currentQuestionIndex < TOTAL_QUESTION_COUNT - 1;
  }

  private getMaxAccessibleQuestionIndex(): number {
    return Math.min(this._responses.size, TOTAL_QUESTION_COUNT - 1);
  }
}

// Use Case
export class ManageSurveySessionUseCase {
  constructor(
    private readonly sessionRepository: SurveySessionRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Creates or resumes a survey session for a user.
   * Returns existing incomplete session or creates new one.
   */
  async getOrCreateSession(userId: string): Promise<SurveySession> {
    this.logger.info('Getting or creating survey session', { userId });

    try {
      // Try to find existing incomplete session
      const existingSession = await this.sessionRepository.findIncompleteByUserId(userId);
      if (existingSession) {
        this.logger.info('Resuming existing survey session', { 
          sessionId: existingSession.id,
          currentProgress: existingSession.responses.size 
        });
        return existingSession;
      }

      // Create new session
      const newSession = new SurveySession(
        generateId(),
        userId,
        new Map()
      );

      await this.sessionRepository.save(newSession);
      this.logger.info('Created new survey session', { sessionId: newSession.id });
      
      return newSession;
    } catch (error) {
      this.logger.error('Failed to get or create survey session', { error, userId });
      throw new SessionError('Unable to start survey session', error);
    }
  }

  /**
   * Records a user's answer and updates session state.
   * Automatically saves progress and handles navigation.
   */
  async recordAnswer(
    sessionId: string,
    questionId: string,
    answer: QuestionAnswer
  ): Promise<SurveySession> {
    this.logger.debug('Recording survey answer', { sessionId, questionId });

    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        throw new SessionNotFoundError(`Session ${sessionId} not found`);
      }

      // Validate the answer
      const question = await this.questionRepository.findById(questionId);
      if (!question) {
        throw new QuestionNotFoundError(`Question ${questionId} not found`);
      }

      const validation = this.validateAnswer(question, answer);
      if (!validation.isValid) {
        throw new ValidationError('Invalid answer provided', 'answer', answer);
      }

      // Record the answer
      session.recordAnswer(questionId, answer);

      // Save progress
      await this.sessionRepository.save(session);
      
      this.logger.info('Answer recorded successfully', {
        sessionId,
        questionId,
        progress: session.responses.size,
        isComplete: session.isComplete
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to record answer', { error, sessionId, questionId });
      throw error instanceof DomainError ? error : 
        new SessionError('Unable to record answer', error);
    }
  }

  private validateAnswer(
    question: EnneagramSurveyQuestion,
    answer: QuestionAnswer
  ): ValidationResult {
    // Implementation details...
    return { isValid: true, errors: [] };
  }
}

// React Hook
export function useSurveySession(userId: string) {
  const [session, setSession] = useState<SurveySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const sessionUseCase = useService<ManageSurveySessionUseCase>('sessionUseCase');

  // Load or create session on mount
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const sessionData = await sessionUseCase.getOrCreateSession(userId);
        
        if (mounted) {
          setSession(sessionData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      mounted = false;
    };
  }, [userId, sessionUseCase]);

  // Action to record an answer
  const recordAnswer = useCallback(async (
    questionId: string,
    answer: QuestionAnswer
  ) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setError(null);
      const updatedSession = await sessionUseCase.recordAnswer(
        session.id,
        questionId,
        answer
      );
      setSession(updatedSession);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record answer');
      setError(error);
      throw error;
    }
  }, [session, sessionUseCase]);

  // Action to navigate to question
  const navigateToQuestion = useCallback((index: number) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      session.navigateToQuestion(index);
      setSession(new SurveySession(
        session.id,
        session.userId,
        new Map(session.responses),
        index,
        session.startedAt
      ));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Navigation failed');
      setError(error);
      throw error;
    }
  }, [session]);

  return {
    session,
    isLoading,
    error,
    actions: {
      recordAnswer,
      navigateToQuestion
    }
  };
}

// React Component
export const SurveySessionProvider: React.FC<{
  userId: string;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const sessionState = useSurveySession(userId);

  if (sessionState.isLoading) {
    return <SurveyLoadingSpinner />;
  }

  if (sessionState.error) {
    return <SurveyErrorDisplay error={sessionState.error} />;
  }

  if (!sessionState.session) {
    return <SurveyUnavailableMessage />;
  }

  return (
    <SurveySessionContext.Provider value={sessionState}>
      {children}
    </SurveySessionContext.Provider>
  );
};
```

## Final Guidelines

### Code Review Checklist
- [ ] **Type Safety**: All functions have explicit return types
- [ ] **Error Handling**: All async operations wrapped in try-catch
- [ ] **Testing**: Unit tests written before implementation
- [ ] **Documentation**: Public APIs documented with JSDoc
- [ ] **Performance**: No unnecessary re-renders or computations
- [ ] **Accessibility**: ARIA labels and keyboard navigation
- [ ] **Security**: Input validation and sanitization
- [ ] **Modularity**: Clear separation of concerns
- [ ] **Mobile-First**: Responsive design implemented

### Commit Message Standards
```
type(scope): brief description

Detailed explanation of what was changed and why.

Types: feat, fix, docs, style, refactor, test, chore
Scopes: auth, survey, results, ui, api, deps

Examples:
feat(survey): add question navigation with validation
fix(auth): handle expired token refresh correctly
docs(api): update service interface documentation
test(survey): add comprehensive scoring algorithm tests
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci && npm run type-check"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

This style guide ensures that every piece of code written for the Enneagram Discovery App maintains high quality, readability, and maintainability while following software engineering best practices for modularity and abstraction.