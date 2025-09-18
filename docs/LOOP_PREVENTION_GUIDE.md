# Loop Prevention Guide

This document outlines the patterns and best practices implemented to prevent state loops and authentication loops in the Parscade application.

## 🔄 State Loop Prevention

### 1. **useEffect Dependency Management**

**Problem**: Infinite re-renders caused by missing or incorrect dependencies.

**Solution**: 
- Use exhaustive dependency arrays
- Memoize objects and functions with `useMemo` and `useCallback`
- Use refs for values that shouldn't trigger re-renders

```typescript
// ❌ Bad - Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// ✅ Good - Proper dependencies
const fetchData = useCallback(async (id: string) => {
  // fetch logic
}, []);

useEffect(() => {
  if (userId) {
    fetchData(userId);
  }
}, [userId, fetchData]);
```

### 2. **Memoization Patterns**

**Problem**: Unnecessary re-renders and function recreations.

**Solution**: Strategic use of `useMemo`, `useCallback`, and `React.memo`.

```typescript
// ✅ Memoized context value
const value: AuthContextType = useMemo(() => ({
  ...state,
  signIn,
  signUp,
  signOut,
}), [state, signIn, signUp, signOut]);

// ✅ Memoized callbacks
const handleSubmit = useCallback(async (data) => {
  // submit logic
}, [dependencies]);
```

### 3. **State Update Guards**

**Problem**: Redundant state updates causing cascading re-renders.

**Solution**: Use refs and guards to prevent unnecessary updates.

```typescript
const loadingRef = useRef<boolean>(false);

const loadData = useCallback(async () => {
  // Prevent concurrent requests
  if (loadingRef.current) return;
  
  loadingRef.current = true;
  try {
    // load data
  } finally {
    loadingRef.current = false;
  }
}, []);
```

## 🔐 Authentication Loop Prevention

### 1. **Route Protection Without Loops**

**Problem**: Redirect loops between protected and public routes.

**Solution**: Centralized route guards with loading states.

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};
```

### 2. **Auth State Initialization**

**Problem**: Multiple auth state checks causing loops.

**Solution**: Single initialization with proper cleanup.

```typescript
useEffect(() => {
  let isMounted = true;

  const initializeAuth = async () => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!isMounted) return;
    
    // Set initial state
    if (session?.user) {
      dispatch({ type: 'AUTH_SUCCESS', payload: session.user });
    } else {
      dispatch({ type: 'SET_INITIALIZED' });
    }
    
    // Set up listener AFTER initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authStateChangeRef.current = subscription;
  };

  void initializeAuth();

  return () => {
    isMounted = false;
    if (authStateChangeRef.current) {
      authStateChangeRef.current.unsubscribe();
    }
  };
}, []); // Empty dependency - run once only
```

### 3. **Token Refresh Management**

**Problem**: Infinite token refresh loops.

**Solution**: Proper error handling and retry limits.

```typescript
const refreshToken = useCallback(async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    // Don't retry on certain errors to prevent loops
    if (error.message.includes('refresh_token_not_found')) {
      await signOut();
      return null;
    }
    throw error;
  }
}, [signOut]);
```

## 🛡️ Best Practices Implemented

### 1. **Component-Level Guards**

- Remove auth checks from individual components
- Use route-level protection instead
- Centralize authentication logic

### 2. **State Management**

- Use reducers for complex state logic
- Memoize context values and callbacks
- Prevent redundant state updates

### 3. **Error Boundaries**

- Catch and handle errors gracefully
- Prevent error loops with proper fallbacks
- Log errors for debugging

### 4. **Loading States**

- Show loading indicators during async operations
- Prevent user interactions during loading
- Use skeleton screens for better UX

## 🧪 Testing Patterns

### 1. **Authentication Flow Tests**

```typescript
describe('Authentication Flow', () => {
  it('should not create redirect loops', async () => {
    // Test login → protected route navigation
    // Verify single redirect only
  });

  it('should handle token refresh without loops', async () => {
    // Test expired token → refresh → retry
    // Verify no infinite retries
  });
});
```

### 2. **State Update Tests**

```typescript
describe('State Updates', () => {
  it('should not cause infinite re-renders', async () => {
    // Monitor render count
    // Verify stable state after updates
  });
});
```

## 🚨 Common Pitfalls Avoided

### 1. **useEffect Dependencies**
- ❌ Missing dependencies causing stale closures
- ❌ Object/function dependencies causing infinite loops
- ✅ Proper memoization and exhaustive dependencies

### 2. **Authentication State**
- ❌ Multiple auth checks in components
- ❌ Redirect loops between routes
- ✅ Centralized auth state with route guards

### 3. **Async Operations**
- ❌ Concurrent requests causing race conditions
- ❌ Missing cleanup causing memory leaks
- ✅ Proper request deduplication and cleanup

### 4. **Form Handling**
- ❌ Recreating handlers on every render
- ❌ Uncontrolled state updates
- ✅ Memoized handlers and controlled updates

## 📊 Performance Monitoring

### 1. **React DevTools Profiler**
- Monitor component render frequency
- Identify unnecessary re-renders
- Optimize hot paths

### 2. **Custom Hooks for Debugging**
```typescript
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  useEffect(() => {
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
};
```

### 3. **Performance Budgets**
- Set limits on render frequency
- Monitor bundle size impact
- Track authentication flow timing

This guide ensures the application maintains stable state management and authentication flows without loops or excessive re-renders.