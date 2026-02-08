# TODO: Fix 401 Unauthorized errors in Fraud Analytics

## Issue
- FraudAnalytics page makes requests to admin-only API endpoints but route is not protected
- Non-admin users get 401 errors when accessing fraud analytics

## Plan
- [ ] Protect `/fraud-analytics` route in App.jsx with admin role requirement

## Testing
- [ ] Verify admin users can access fraud analytics
- [ ] Verify non-admin users are redirected to unauthorized page
