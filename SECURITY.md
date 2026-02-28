# Security Guide - Smart Land Management System

## Overview

This document outlines the security measures implemented in the Smart Land Management System and best practices for maintaining a secure deployment.

## Authentication & Authorization

### Current Implementation

- **Token-based authentication** using Django's signing framework
- **7-day token expiration** for automatic session timeout
- **Rate limiting** on login endpoint (5 attempts per 60 seconds per IP)
- **Secure password storage** (credentials in environment variables only)

### Security Recommendations

1. **Change Default Credentials Immediately**
   ```bash
   # In backend/.env
   ADMIN_EMAIL=your-secure-email@domain.com
   ADMIN_PASSWORD=YourVeryStrongPassword123!@#
   ```

2. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and special characters
   - Never reuse passwords from other services
   - Consider using a password manager

3. **Rotate Credentials Regularly**
   - Change admin password every 90 days
   - Rotate Django secret key annually
   - Update API keys when compromised

## Database Security

### MongoDB Atlas Configuration

1. **Network Access**
   - ✅ Whitelist specific IP addresses only
   - ❌ Never use 0.0.0.0/0 in production
   - Use VPN or fixed IPs for admin access

2. **Database Users**
   - Create separate users for different environments
   - Use strong, unique passwords (20+ characters)
   - Grant minimum required privileges
   - Enable audit logging

3. **Connection Security**
   - Always use `mongodb+srv://` (TLS/SSL enabled)
   - Never expose connection strings in client code
   - Store credentials in environment variables only
   - Use connection string with database name included

4. **Backup Strategy**
   - Enable automatic backups in Atlas
   - Test restore procedures regularly
   - Keep backups for at least 30 days
   - Store backup credentials separately

## API Security

### CORS Configuration

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://your-production-domain.com',
    'https://www.your-production-domain.com',
]
CORS_ALLOW_CREDENTIALS = True
```

**Never use:**
- `CORS_ALLOW_ALL_ORIGINS = True`
- Wildcard origins in production

### CSRF Protection

```python
CSRF_TRUSTED_ORIGINS = [
    'https://your-production-domain.com',
]
```

### Rate Limiting

Current implementation:
- Login: 5 attempts per 60 seconds per IP
- Consider adding rate limiting to other endpoints

Recommended additions:
- API endpoints: 100 requests per minute per IP
- File uploads: 10 per hour per user
- Export operations: 5 per hour per user

## Environment Variables

### Required Security Measures

1. **Never Commit .env Files**
   ```bash
   # Already in .gitignore
   .env
   .env.local
   backend/.env
   ```

2. **Use Strong Secret Keys**
   ```bash
   # Generate Django secret key
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

3. **Separate Environments**
   - Development: `.env.development`
   - Staging: `.env.staging`
   - Production: `.env.production`

4. **Secure Storage**
   - Use platform-specific secret management (Railway, Vercel, etc.)
   - Never share credentials via email or chat
   - Use encrypted password managers for team access

## HTTPS/TLS

### Requirements

- ✅ Always use HTTPS in production
- ✅ Enable HSTS (Strict-Transport-Security header)
- ✅ Use valid SSL certificates (Let's Encrypt, etc.)
- ❌ Never allow HTTP in production

### Configuration

Most platforms (Vercel, Railway, Netlify) provide automatic HTTPS.

For custom deployments:
```nginx
# Nginx example
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

## Input Validation

### Backend Validation

All user inputs are validated:
- Email format validation
- Field length limits
- Type checking
- SQL injection prevention (using MongoDB, not SQL)
- XSS prevention (JSON API only)

### Frontend Validation

- Form validation before submission
- Type checking with TypeScript
- Sanitization of user-generated content

## Security Headers

Implemented in Next.js config:

```typescript
{
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self)'
}
```

## Dependency Security

### Regular Updates

```bash
# Backend
cd backend
pip list --outdated
pip install --upgrade -r requirements.txt

# Frontend
cd land-management
npm outdated
npm update
npm audit fix
```

### Automated Scanning

Enable on GitHub:
- Dependabot alerts
- Security advisories
- Code scanning

## Logging & Monitoring

### What to Log

✅ Log:
- Authentication attempts (success/failure)
- API errors and exceptions
- Database connection issues
- Rate limit violations

❌ Never Log:
- Passwords or tokens
- Full connection strings
- Personal identifiable information (PII)
- Credit card or payment information

### Monitoring Setup

1. **Application Monitoring**
   - Use platform-provided logs (Railway, Vercel)
   - Set up error tracking (Sentry, Rollbar)
   - Monitor response times and errors

2. **Database Monitoring**
   - MongoDB Atlas provides built-in monitoring
   - Set up alerts for:
     - High connection count
     - Slow queries
     - Storage usage
     - Failed authentication attempts

3. **Uptime Monitoring**
   - Use services like UptimeRobot or Pingdom
   - Monitor both frontend and backend
   - Set up alerts for downtime

## Incident Response

### If Credentials Are Compromised

1. **Immediate Actions**
   - Change all affected passwords immediately
   - Rotate API keys and tokens
   - Generate new Django secret key
   - Review access logs for suspicious activity

2. **Investigation**
   - Check MongoDB Atlas access logs
   - Review application logs
   - Identify scope of breach
   - Document timeline

3. **Recovery**
   - Update all environment variables
   - Redeploy applications
   - Notify users if necessary
   - Implement additional security measures

### If Database Is Compromised

1. **Immediate Actions**
   - Disable compromised database user
   - Create new database user with new password
   - Update connection strings
   - Review network access rules

2. **Assessment**
   - Check what data was accessed
   - Review audit logs
   - Identify attack vector

3. **Recovery**
   - Restore from backup if necessary
   - Implement stricter access controls
   - Update security procedures

## Security Checklist

### Pre-Deployment

- [ ] Changed default admin credentials
- [ ] Generated strong Django secret key
- [ ] Set DEBUG=False
- [ ] Configured MongoDB Atlas with strong password
- [ ] Restricted MongoDB network access
- [ ] Set proper CORS origins (no wildcards)
- [ ] Set proper ALLOWED_HOSTS
- [ ] Enabled HTTPS
- [ ] Reviewed all environment variables
- [ ] Removed any hardcoded secrets from code
- [ ] Updated all dependencies
- [ ] Ran security audit (npm audit, pip check)

### Post-Deployment

- [ ] Verified HTTPS is working
- [ ] Tested authentication flow
- [ ] Verified MongoDB connection
- [ ] Checked CORS is working correctly
- [ ] Tested rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configured backup strategy
- [ ] Documented all credentials securely
- [ ] Set up log aggregation
- [ ] Tested incident response procedures

### Ongoing Maintenance

- [ ] Review logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate credentials quarterly
- [ ] Review access controls quarterly
- [ ] Test backups monthly
- [ ] Security audit annually
- [ ] Penetration testing annually (if budget allows)

## Compliance Considerations

### Data Protection

- Store minimal user data
- Implement data retention policies
- Provide data export functionality
- Allow users to delete their data
- Encrypt sensitive data at rest and in transit

### Privacy

- Don't collect unnecessary personal information
- Provide clear privacy policy
- Obtain consent for data collection
- Allow users to opt-out of analytics

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security concerns to: [your-security-email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential.
