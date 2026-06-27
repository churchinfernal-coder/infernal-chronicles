// 
// ADD THESE ROUTES TO YOUR src/App.tsx FILE
// Insert after your existing routes, before the NotFound route
// 

// 1. ADD THIS IMPORT at the top of App.tsx (with other lazy imports):
const LandingPage = React.lazy(() => import("./pages/landing/LandingPage"));

// 2. ADD THESE ROUTES inside your <Routes> component:
<Route path="/landing/:country" element={
  <Suspense fallback={<LoadingFallback />}>
    <LandingPage />
  </Suspense>
} />
<Route path="/landing/:country/:state" element={
  <Suspense fallback={<LoadingFallback />}>
    <LandingPage />
  </Suspense>
} />
<Route path="/landing/:country/:state/:city" element={
  <Suspense fallback={<LoadingFallback />}>
    <LandingPage />
  </Suspense>
} />

// 
// EXAMPLE: Complete Routes Section
// 
/*
<Routes>
  <Route path="/" element={...} />
  <Route path="/auth" element={...} />
  
  // ADD LANDING PAGE ROUTES HERE 
  <Route path="/landing/:country" element={
    <Suspense fallback={<LoadingFallback />}>
      <LandingPage />
    </Suspense>
  } />
  <Route path="/landing/:country/:state" element={
    <Suspense fallback={<LoadingFallback />}>
      <LandingPage />
    </Suspense>
  } />
  <Route path="/landing/:country/:state/:city" element={
    <Suspense fallback={<LoadingFallback />}>
      <LandingPage />
    </Suspense>
  } />
  
  <Route path="*" element={<NotFound />} />
</Routes>
*/
