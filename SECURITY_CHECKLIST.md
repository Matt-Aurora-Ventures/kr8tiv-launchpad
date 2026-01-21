# KR8TIV Launchpad Security Checklist

Use this checklist before deploying to production or after major changes.

## Pre-Deployment Checklist

### Secrets Management
- [ ] All secrets stored in environment variables (not in code)
- [ ] No hardcoded API keys, passwords, or private keys
- [ ] .env file is in .gitignore
- [ ] Different secrets for dev/staging/production
- [ ] Secrets generated with cryptographically secure methods
- [ ] ADMIN_API_KEY is at least 32 characters
- [ ] Private keys generated with proper tooling (solana-keygen or openssl)

### HTTPS & Transport Security
- [ ] HTTPS enforced in production (HSTS enabled)
- [ ] SSL certificates are valid and not expired
- [ ] HTTP redirects to HTTPS
- [ ] Secure WebSocket connections (wss://)

### Authentication & Authorization
- [ ] Admin routes protected with API key authentication
- [ ] API keys are hashed before storage (not plain text)
- [ ] Wallet signature verification for user operations
- [ ] Sensitive operations require re-authentication
- [ ] Session/token expiration implemented

### Rate Limiting
- [ ] Rate limiting enabled on all endpoints
- [ ] Stricter limits on sensitive endpoints (launch, staking)
- [ ] IP-based blocking for abusive clients
- [ ] Rate limit headers returned to clients

### Input Validation
- [ ] All user input validated with Zod schemas
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (output encoding, CSP headers)
- [ ] Request body size limits configured
- [ ] Deep nesting limits on JSON payloads
- [ ] File upload size limits (if applicable)

### CORS & Headers
- [ ] CORS configured with specific origins (not wildcard in production)
- [ ] Security headers enabled (helmet middleware)
- [ ] Content-Security-Policy configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY (or CSP frame-ancestors)
- [ ] Referrer-Policy configured

### Error Handling
- [ ] Error messages dont leak sensitive information
- [ ] Stack traces not exposed in production
- [ ] Generic error messages for authentication failures
- [ ] Errors logged internally with full details

### Audit Logging
- [ ] Admin operations logged
- [ ] Authentication attempts logged (success and failure)
- [ ] Sensitive data operations logged
- [ ] Logs do not contain secrets or PII
- [ ] Log retention policy defined

### Dependencies
- [ ] All dependencies up to date
- [ ] npm audit shows no critical vulnerabilities
- [ ] Dependencies from trusted sources
- [ ] Lock file committed to repo

### Solana/Blockchain Specific
- [ ] Transaction signing done server-side with secure keys
- [ ] Private keys never sent to client
- [ ] Transaction simulation before execution
- [ ] Proper error handling for failed transactions
- [ ] Wallet addresses validated before use

### Database
- [ ] Database credentials are strong
- [ ] Database connection uses SSL
- [ ] Principle of least privilege for DB user
- [ ] SQL injection prevented (Prisma handles this)
- [ ] Sensitive data encrypted at rest

### Infrastructure
- [ ] Server access restricted to authorized personnel
- [ ] SSH key-based authentication only
- [ ] Firewall rules configured
- [ ] Unnecessary ports closed
- [ ] Regular security patches applied

## Periodic Security Tasks

### Weekly
- [ ] Review audit logs for suspicious activity
- [ ] Check rate limit violations
- [ ] Monitor for unusual traffic patterns

### Monthly
- [ ] Run npm audit and update dependencies
- [ ] Review and rotate API keys if needed
- [ ] Check SSL certificate expiration
- [ ] Review access permissions

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing (if applicable)
- [ ] Review and update security policies
- [ ] Rotate long-lived secrets

## Incident Response

### In Case of Security Breach
1. [ ] Immediately rotate all secrets
2. [ ] Review audit logs to determine scope
3. [ ] Block malicious IPs
4. [ ] Notify affected users if applicable
5. [ ] Document incident and response
6. [ ] Post-mortem and remediation

## Security Contacts

- Security Lead: [Add contact]
- On-call: [Add contact]
- Bug bounty program: [Add link if applicable]

---

Last updated: [DATE]
Reviewed by: [NAME]
