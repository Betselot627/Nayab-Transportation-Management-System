# 🧪 Testing Checklist - Dark Mode & Profile Navigation

## Backend Status: ✅ Running Correctly

---

## 🔐 Authentication Tests

### Login Page

- [ ] Navigate to `/login`
- [ ] Toggle between Light/Dark mode (manually via browser if no toggle yet)
- [ ] Verify dark mode classes work:
  - Background is dark
  - Text is white/light gray
  - Input fields are dark
  - Buttons have dark variants
- [ ] Login with credentials:
  - Admin: `admin@ntms.com` / `admin123`
  - Test other roles if available
- [ ] Verify successful login redirects to dashboard

### Register Page

- [ ] Navigate to `/register`
- [ ] Check dark mode styling
- [ ] Verify all form fields are visible in both themes
- [ ] Test registration (optional)

---

## 🧭 Profile Navigation Tests

### From Sidebar (All Roles)

1. **Admin User:**
   - [ ] Login as admin
   - [ ] Find user info in sidebar (name and avatar)
   - [ ] Click on the name or avatar
   - [ ] ✅ Should navigate to `/admin/settings`
   - [ ] Verify Settings page loads

2. **Driver User:**
   - [ ] Login as driver
   - [ ] Click on name/avatar in sidebar
   - [ ] ✅ Should navigate to `/driver/profile`
   - [ ] Verify Profile page loads

3. **Customer User:**
   - [ ] Login as customer
   - [ ] Click on name/avatar in sidebar
   - [ ] ✅ Should navigate to `/customer/profile`
   - [ ] Verify Profile page loads

---

## 🎨 Dark Mode Tests

### Admin Settings Page

- [ ] Navigate to `/admin/settings`
- [ ] Go to "Preferences" tab
- [ ] Click "Switch to Dark Mode"
- [ ] ✅ Entire interface should turn dark
- [ ] Check all three tabs work in dark mode:
  - [ ] Profile tab
  - [ ] Security tab
  - [ ] Preferences tab
- [ ] Refresh the page
- [ ] ✅ Dark mode should persist
- [ ] Click "Switch to Light Mode"
- [ ] ✅ Should return to light theme
- [ ] Refresh again
- [ ] ✅ Light mode should persist

### Profile Photo Upload (Admin)

- [ ] Go to Profile tab
- [ ] Click camera icon on profile image
- [ ] Upload a photo (under 5MB)
- [ ] Click "Save Changes"
- [ ] ✅ Photo should update
- [ ] Check if photo appears in sidebar
- [ ] Check if photo persists after refresh

### Password Change (Admin)

- [ ] Go to Security tab
- [ ] Enter current password
- [ ] Enter new password (min 6 chars)
- [ ] Confirm new password
- [ ] Click "Change Password"
- [ ] ✅ Should show success message
- [ ] Try logging out and back in with new password

---

## 👤 Customer Profile Tests

### Profile Information

- [ ] Login as customer
- [ ] Navigate to `/customer/profile` (click name in sidebar)
- [ ] Verify "Profile Information" tab loads
- [ ] Check dark mode styling
- [ ] Upload profile photo
- [ ] Update personal details:
  - [ ] Full Name
  - [ ] Phone Number
  - [ ] Company Name
  - [ ] Address
- [ ] Click "Save Changes"
- [ ] ✅ Should show success toast
- [ ] Verify changes persist after refresh

### Change Password

- [ ] Go to "Change Password" tab
- [ ] Enter current password
- [ ] Enter new password
- [ ] Confirm password
- [ ] Click "Change Password"
- [ ] ✅ Should show success message

### Dark Mode Persistence

- [ ] Switch to dark mode (if admin account available)
- [ ] Navigate to customer profile
- [ ] ✅ Should still be in dark mode
- [ ] All elements should be styled correctly

---

## 🚗 Driver Profile Tests

### Driver Details Tab

- [ ] Login as driver
- [ ] Navigate to `/driver/profile` (click name in sidebar)
- [ ] Verify "Driver Details" tab loads
- [ ] Check dark mode styling
- [ ] Upload profile photo
- [ ] Update fields:
  - [ ] Full Name
  - [ ] Email Address
  - [ ] Phone Number
  - [ ] License Number
  - [ ] License Expiry Date
  - [ ] Years of Experience
- [ ] Click "Save Profile Details"
- [ ] ✅ Should show success toast

### Documents Hub Tab

- [ ] Go to "Documents Hub" tab
- [ ] Check dark mode styling
- [ ] Upload documents:
  - [ ] License Photo
  - [ ] CNIC/ID Document
  - [ ] Medical Certificate
- [ ] Verify file size validation (max 2MB)
- [ ] Click "Save Uploaded Documents"
- [ ] ✅ Should show success message

### Change Password Tab

- [ ] Go to "Change Password" tab
- [ ] Test password change flow
- [ ] ✅ Should work correctly

### Vehicle Information Display

- [ ] If driver has registered vehicles
- [ ] Scroll down on Driver Details tab
- [ ] ✅ Should see "Registered Vehicle specs" section
- [ ] Verify vehicle details display correctly

---

## 📊 Dashboard Tests

### Admin Dashboard

- [ ] Navigate to `/admin/dashboard`
- [ ] Check dark mode styling:
  - [ ] Stat cards
  - [ ] Charts (Area, Pie, Bar)
  - [ ] Vehicle status table
  - [ ] Text and backgrounds
- [ ] Verify data loads from backend
- [ ] Test "Refresh Data" button
- [ ] ✅ All elements should be visible and styled correctly

### Customer Dashboard

- [ ] Login as customer
- [ ] Navigate to customer dashboard
- [ ] Check dark mode (if enabled)
- [ ] ⚠️ May need dark mode classes added

### Driver Dashboard

- [ ] Login as driver
- [ ] Navigate to driver dashboard
- [ ] Check dark mode (if enabled)
- [ ] ⚠️ May need dark mode classes added

---

## 🚚 Vehicle Management Tests

### Vehicle List Page

- [ ] Navigate to `/admin/vehicles`
- [ ] Check dark mode styling:
  - [ ] Header
  - [ ] Search bar
  - [ ] Filter dropdown
  - [ ] Data table
  - [ ] Pagination
  - [ ] Action buttons
- [ ] Test search functionality
- [ ] Test filter by status
- [ ] Test pagination controls
- [ ] Click Edit button on a vehicle
- [ ] Click Delete button (test confirmation)
- [ ] Click "Add Vehicle" button
- [ ] ✅ All should work in both light and dark modes

### Add Vehicle Page

- [ ] Navigate to `/admin/vehicles/add`
- [ ] Check if form has dark mode
- [ ] ⚠️ May need dark mode classes added

---

## 🎯 Cross-Page Tests

### Theme Persistence Across Pages

1. [ ] Login and enable dark mode
2. [ ] Navigate to different pages:
   - [ ] Dashboard
   - [ ] Vehicles
   - [ ] Profile
   - [ ] Settings
3. [ ] ✅ Dark mode should stay active on all pages
4. [ ] Refresh on any page
5. [ ] ✅ Dark mode should persist

### Profile Navigation from Any Page

1. [ ] Go to Dashboard
2. [ ] Click name in sidebar
3. [ ] ✅ Should navigate to profile
4. [ ] Go back to Dashboard
5. [ ] Go to Vehicles page
6. [ ] Click name in sidebar again
7. [ ] ✅ Should navigate to profile

---

## 📱 Mobile/Responsive Tests

### Mobile Menu

- [ ] Resize browser to mobile width (<768px)
- [ ] Click hamburger menu icon
- [ ] ✅ Sidebar should slide in
- [ ] Click user name/avatar
- [ ] ✅ Should navigate to profile AND close menu
- [ ] Open menu again
- [ ] Click a navigation link
- [ ] ✅ Menu should close

### Dark Mode on Mobile

- [ ] Enable dark mode
- [ ] Test on mobile width
- [ ] Check all pages are readable
- [ ] Verify touch targets are large enough

---

## 🔗 Backend Integration Tests

### Profile Updates

- [ ] Update profile information
- [ ] Check browser Network tab
- [ ] ✅ Should see PUT request to `/users/:id` or `/profile/me`
- [ ] Verify 200 OK response
- [ ] Check updated data persists

### Password Change

- [ ] Change password
- [ ] Check Network tab
- [ ] ✅ Should see PUT request to `/auth/update-password`
- [ ] Verify success response
- [ ] Test logging in with new password

### Photo Upload

- [ ] Upload profile photo
- [ ] Check Network tab
- [ ] ✅ Should send base64 image data
- [ ] Verify image URL is returned
- [ ] Check image displays correctly

### Dashboard Data

- [ ] Refresh Admin Dashboard
- [ ] Check Network tab
- [ ] ✅ Should see API calls for:
  - Vehicles
  - Drivers
  - Customers
  - Trips/Shipments
- [ ] Verify data populates correctly

---

## 🐛 Known Issues to Check

### Potential Issues

- [ ] Charts may not have dark mode colors yet (Recharts config needed)
- [ ] Some status badges might have poor contrast in dark mode
- [ ] Modal/Dialog components might not have dark mode
- [ ] Customer/Driver dashboards might not have dark mode yet
- [ ] Form pages (Add/Edit) might not have dark mode yet

### Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge

---

## ✅ Success Criteria

### Core Features Working:

- ✅ Profile navigation from sidebar works for all roles
- ✅ Dark mode toggle works
- ✅ Theme persists across sessions (localStorage)
- ✅ Profile updates save to backend
- ✅ Password change works
- ✅ Photo upload works

### UI/UX Quality:

- ✅ All text is readable in both themes
- ✅ Sufficient color contrast (WCAG AA)
- ✅ Smooth transitions (300ms)
- ✅ No visual glitches
- ✅ Mobile responsive

### Backend Integration:

- ✅ API calls succeed
- ✅ Data persists correctly
- ✅ Error messages display properly
- ✅ Loading states work

---

## 🚨 If Issues Found

### Profile Navigation Not Working

1. Check Sidebar.jsx - verify onClick handler is added
2. Check console for errors
3. Verify routes exist in App.jsx

### Dark Mode Not Working

1. Check browser console for errors
2. Verify ThemeProvider is wrapping App in main.jsx
3. Check localStorage for 'theme' key
4. Verify dark mode classes are applied to HTML root element

### Backend Errors

1. Check backend is running on correct port
2. Verify CORS settings allow frontend domain
3. Check API_URL in .env file
4. Look at Network tab for failed requests

### Photo Upload Issues

1. Verify file size is under limit (2-5MB)
2. Check backend accepts base64 images
3. Verify backend storage is configured (Cloudinary)

---

## 📋 Final Checklist

- [ ] All profile pages load without errors
- [ ] Profile navigation works from all pages
- [ ] Dark mode toggle works
- [ ] Theme persists after refresh
- [ ] Backend integration works (profile updates, password change)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Data persists correctly
- [ ] User experience is smooth

---

**Status**: Ready for testing with backend running! 🚀

**Tester**: Follow this checklist step by step and mark items as complete.

**Report Issues**: Document any issues found with screenshots and console errors.
