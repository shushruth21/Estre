# 🔐 Test User Credentials for Development

**Last Updated**: November 21, 2025
**Environment**: Development/Testing
**Status**: ✅ Active

---

## 🎯 Quick Access Credentials

### 👨‍💼 **Admin Account**
```
Email:    newadmin@estre.in
Password: SecurePassword123!
Role:     admin
Access:   Full system administration
```

**Capabilities:**
- ✅ Manage all users
- ✅ Configure system settings
- ✅ View all orders and job cards
- ✅ Manage products and pricing
- ✅ Access admin dashboard
- ✅ Create/edit dropdown options
- ✅ Manage discount codes

---

### 👷 **Staff Account**
```
Email:    newstaff@estre.in
Password: SecurestaffPassword123!
Role:     staff
Access:   Production and operations
```

**Capabilities:**
- ✅ View and manage job cards
- ✅ View assigned orders
- ✅ Update order status
- ✅ Generate production documents
- ✅ Access staff dashboard
- ✅ Quality control functions
- ⛔ Cannot access admin settings

---

### 👤 **Customer Account** (Owner)
```
Email:    shushruth.legend@gmail.com
Role:     customer
Access:   Standard customer features
```

**Capabilities:**
- ✅ Browse products
- ✅ Configure furniture
- ✅ Place orders
- ✅ View order history
- ✅ Access customer dashboard
- ⛔ Cannot access admin or staff areas

---

## 🔒 Security Notes

### **Password Requirements**
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Special characters recommended

### **Current Password Patterns**
- **Admin**: `SecurePassword123!` - Meets all requirements ✅
- **Staff**: `SecurestaffPassword123!` - Enhanced security ✅

### **⚠️ IMPORTANT WARNINGS**

1. **DO NOT USE IN PRODUCTION**
   - These are test credentials only
   - Change immediately before going live
   - Never commit credentials to version control

2. **Password Storage**
   - All passwords are hashed in Supabase
   - Never store passwords in plain text
   - Use environment variables for sensitive data

3. **Access Control**
   - All routes protected by ProtectedRoute component
   - Row Level Security (RLS) enforced in Supabase
   - Role-based access control (RBAC) implemented

---

## 📊 User Roles Hierarchy

```
┌─────────────────────────────────────┐
│          admin                      │
│  (Full system access)               │
│                                     │
│  ├─ All admin functions            │
│  ├─ All staff functions            │
│  └─ All customer functions         │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│          staff                      │
│  (Operations & production)          │
│                                     │
│  ├─ Job card management            │
│  ├─ Order status updates           │
│  ├─ QC inspections                 │
│  └─ Production documents           │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│        customer                     │
│  (Standard user access)             │
│                                     │
│  ├─ Product browsing               │
│  ├─ Configuration                  │
│  ├─ Order placement                │
│  └─ Order tracking                 │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Workflows

### **Test Admin Functions**
1. Login as admin → `newadmin@estre.in`
2. Navigate to `/admin/dashboard`
3. Test user management
4. Test system settings
5. Test product management

### **Test Staff Functions**
1. Login as staff → `newstaff@estre.in`
2. Navigate to `/staff/dashboard`
3. Test job card access
4. Test order management
5. Test QC inspection forms

### **Test Customer Journey**
1. Logout if logged in
2. Browse products at `/products`
3. Configure a product
4. Add to cart
5. Login/signup to checkout
6. Complete order

---

## 🔄 Password Reset Testing

### **Test Forgot Password Flow**
1. Go to `/login`
2. Click "Forgot password?"
3. Enter email: `newadmin@estre.in`
4. Check Supabase inbox for reset link
5. Click link → redirects to `/reset-password`
6. Set new password
7. Login with new credentials

### **Password Reset Requirements**
- Minimum 8 characters
- Uppercase + lowercase + number
- Real-time strength indicator
- Confirmation field validation

---

## 📝 Creating Additional Test Users

### **Option 1: Via Supabase Dashboard**
1. Go to Supabase Dashboard
2. Authentication → Users
3. Click "Add user"
4. Enter email and password
5. Confirm email automatically
6. Update profile role via SQL:
   ```sql
   UPDATE profiles
   SET role = 'staff', full_name = 'New Staff Member'
   WHERE user_id = 'USER_ID_HERE';
   ```

### **Option 2: Via Signup Page**
1. Navigate to `/signup`
2. Fill in registration form
3. Submit (creates customer by default)
4. Admin can update role later

### **Option 3: Via Admin Panel**
1. Login as admin
2. Go to `/admin/users`
3. Click "Create New User"
4. Fill in details and select role
5. User is created with email confirmation

---

## 🗄️ Database Verification

### **Check User Roles**
```sql
SELECT
  u.id,
  u.email,
  p.full_name,
  p.role,
  u.created_at,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email IN (
  'newadmin@estre.in',
  'newstaff@estre.in',
  'shushruth.legend@gmail.com'
)
ORDER BY p.role DESC;
```

### **Verify Role Permissions**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test admin access
SELECT * FROM profiles WHERE role = 'admin';

-- Test staff access
SELECT * FROM job_cards LIMIT 5;
```

---

## 🚀 Quick Login Links

### **Development Server**
```
http://localhost:5173/login
```

### **Production/Staging**
```
https://yourdomain.com/login
```

---

## 🔐 Security Best Practices

### **For Developers**
- ✅ Never commit credentials to Git
- ✅ Use `.env` files for secrets
- ✅ Rotate passwords regularly
- ✅ Enable MFA for admin accounts (when available)
- ✅ Monitor authentication logs
- ✅ Implement rate limiting

### **For Testing**
- ✅ Use test database, not production
- ✅ Clear test data regularly
- ✅ Test with different user roles
- ✅ Verify RLS policies work correctly
- ✅ Test password reset flow
- ✅ Test session timeout handling

---

## 📧 Email Configuration

### **Supabase Email Templates**
1. **Welcome Email** - Sent on signup
2. **Password Reset** - Sent on forgot password
3. **Email Confirmation** - Sent to verify email (disabled in dev)
4. **Magic Link** - Alternative login method (not implemented)

### **Template URLs**
- **Reset Password**: `${window.location.origin}/reset-password`
- **Confirm Email**: `${window.location.origin}/login`

---

## 🔧 Troubleshooting

### **Cannot Login**
**Symptom**: Invalid credentials error
**Solutions**:
1. Verify email is correct (case-sensitive)
2. Check password (no extra spaces)
3. Verify user exists in database
4. Check RLS policies allow access
5. Clear browser cache/cookies
6. Try password reset flow

### **Wrong Dashboard Redirect**
**Symptom**: Redirected to wrong role dashboard
**Solutions**:
1. Check role in profiles table
2. Verify AuthContext loading role correctly
3. Clear session and login again
4. Check ProtectedRoute component
5. Verify database role normalization

### **Password Reset Not Working**
**Symptom**: Reset link not received or expired
**Solutions**:
1. Check spam/junk folder
2. Verify Supabase email configuration
3. Check reset link expiration (1 hour)
4. Request new reset link
5. Check Supabase email logs

---

## 📞 Support Information

### **For Development Issues**
- Check browser console for errors
- Verify Supabase connection
- Check network tab for API calls
- Review auth state in React DevTools

### **For Database Issues**
- Verify RLS policies
- Check profiles table data
- Verify auth.users entries
- Review Supabase logs

---

## ✅ Testing Checklist

### **Authentication**
- [ ] Admin login works
- [ ] Staff login works
- [ ] Customer login works
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Invalid credentials show error
- [ ] Password visibility toggle works

### **Authorization**
- [ ] Admin can access admin routes
- [ ] Staff can access staff routes
- [ ] Customers cannot access admin/staff routes
- [ ] Unauthorized access redirects correctly
- [ ] RLS policies enforce permissions

### **Password Management**
- [ ] Forgot password sends email
- [ ] Reset link works within 1 hour
- [ ] Password strength meter works
- [ ] New password saves correctly
- [ ] Can login with new password

### **User Experience**
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Success feedback appears
- [ ] Accessibility features work
- [ ] Mobile responsive
- [ ] Keyboard navigation works

---

## 🎯 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Login Page** | ✅ Enhanced | All fixes implemented |
| **Admin User** | ✅ Active | Ready for testing |
| **Staff User** | ✅ Active | Ready for testing |
| **Password Reset** | ✅ Complete | Full flow implemented |
| **Accessibility** | ✅ WCAG AA | Fully compliant |
| **Security** | ✅ Hardened | RLS + RBAC enabled |
| **Documentation** | ✅ Complete | This file! |

---

**🎉 All test credentials are ready to use! Happy testing!**

---

**Need Help?**
- Check the browser console for errors
- Review the LOGIN_PAGE_FIXES_SUMMARY.md for implementation details
- Verify database connectivity
- Check Supabase dashboard for user status

**Last Verified**: November 21, 2025
