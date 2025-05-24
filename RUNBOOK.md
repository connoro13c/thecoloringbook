# Coloring Book App - Production Runbook

## Overview
This runbook contains operational procedures for the Coloring Book App production environment.

## Pre-Deployment Checklist

### Environment Setup
- [ ] Verify all environment variables in Vercel dashboard
- [ ] Confirm Supabase RLS policies are active
- [ ] Check Redis cluster health
- [ ] Validate S3 bucket permissions and lifecycle rules
- [ ] Test Stripe webhook endpoints

### Code Quality Gates
- [ ] All tests passing (`npm run test`)
- [ ] Type checking clean (`npm run type-check`)
- [ ] Linting clean (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Security scan completed

## Deployment Process

### 1. Pre-Deploy
```bash
# Run full test suite
npm run test:coverage
npm run test:e2e

# Security checks
npm audit --audit-level moderate
npm run lint:security
```

### 2. Deploy to Production
```bash
# Automatic via Vercel GitHub integration
git push origin main

# Manual deploy (if needed)
vercel --prod
```

### 3. Post-Deploy Verification
- [ ] Check deployment status in Vercel dashboard
- [ ] Verify Core Web Vitals metrics
- [ ] Test auth flow (sign-in/sign-up)
- [ ] Test image upload pipeline
- [ ] Verify payment processing
- [ ] Check monitoring dashboards

## Monitoring & Alerting

### Key Metrics to Monitor
- **Uptime**: > 99.9%
- **Response Time**: < 2s for API endpoints
- **Error Rate**: < 0.1%
- **Queue Processing**: < 30s per job
- **Payment Success Rate**: > 99%

### Alert Thresholds
- **Critical**: API down > 1 min, Error rate > 1%
- **Warning**: Response time > 5s, Queue backlog > 100 jobs
- **Info**: High traffic, New deployment

### Monitoring Dashboards
- **Vercel Analytics**: Performance metrics
- **Grafana Cloud**: Custom app metrics
- **Supabase Dashboard**: Database health
- **Stripe Dashboard**: Payment metrics

## Incident Response

### Severity Levels
- **P0 (Critical)**: App down, payments failing
- **P1 (High)**: Core features broken, high error rates
- **P2 (Medium)**: Performance degradation, minor features broken
- **P3 (Low)**: Cosmetic issues, non-critical bugs

### Response Times
- **P0**: 15 minutes
- **P1**: 1 hour
- **P2**: 4 hours
- **P3**: Next business day

### Escalation Path
1. On-call engineer
2. Tech lead
3. Engineering manager
4. CTO

## Common Issues & Solutions

### Image Processing Failures
**Symptoms**: Generation jobs stuck, timeouts
**Diagnosis**: Check Redis queue, Amp API status
**Solution**: 
```bash
# Check queue status
redis-cli monitor

# Restart queue workers
vercel env pull
npm run queue:restart
```

### Payment Processing Issues
**Symptoms**: Checkout failures, webhook errors
**Diagnosis**: Stripe dashboard logs
**Solution**: 
- Verify webhook endpoint URL
- Check Stripe API keys
- Review webhook signature verification

### Database Connection Issues
**Symptoms**: 500 errors, auth failures
**Diagnosis**: Supabase dashboard
**Solution**:
- Check connection pool limits
- Verify RLS policies
- Review database logs

### High Memory Usage
**Symptoms**: Function timeouts, OOM errors
**Diagnosis**: Vercel function logs
**Solution**:
- Optimize image processing
- Implement streaming uploads
- Increase function memory limits

## Rollback Procedures

### Vercel Deployment Rollback
```bash
# List recent deployments
vercel list

# Promote previous deployment
vercel promote [deployment-url] --scope=team
```

### Database Migration Rollback
```bash
# Using Supabase CLI
supabase db reset --db-url $DATABASE_URL
supabase db push --db-url $DATABASE_URL
```

### Emergency Contacts
- **On-call Engineer**: +1-xxx-xxx-xxxx
- **Tech Lead**: tech-lead@company.com
- **DevOps**: devops@company.com
- **Security**: security@company.com

## Maintenance Windows
- **Preferred Time**: Sundays 2-4 AM UTC
- **Duration**: Maximum 2 hours
- **Notification**: 48 hours advance notice

## Backup & Recovery

### Database Backups
- **Frequency**: Daily automated backups via Supabase
- **Retention**: 30 days
- **Testing**: Weekly restore tests to staging

### File Storage Backups
- **Frequency**: S3 cross-region replication
- **Retention**: 7 days for generated images
- **Original uploads**: Deleted after 24h (GDPR compliance)

### Recovery Procedures
1. Assess data loss scope
2. Restore from most recent backup
3. Verify data integrity
4. Update monitoring dashboards
5. Communicate with stakeholders

## Performance Optimization

### Core Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Optimization Checklist
- [ ] Image optimization and lazy loading
- [ ] Code splitting and dynamic imports
- [ ] CDN cache headers configured
- [ ] Database query optimization
- [ ] API response caching

## Security Checklist

### Regular Security Tasks
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] SSL certificate renewal (auto via Vercel)
- [ ] Review access logs weekly
- [ ] Rotate API keys quarterly

### Security Incident Response
1. Isolate affected systems
2. Assess breach scope
3. Notify security team
4. Document incident
5. Implement fixes
6. Post-mortem review

## Change Management

### Deployment Schedule
- **Emergency fixes**: Immediate
- **Bug fixes**: Tuesday/Thursday
- **Features**: Weekly release cycle
- **Major changes**: Planned maintenance windows

### Approval Process
- **Hotfixes**: Tech lead approval
- **Regular deployments**: Automated via CI/CD
- **Infrastructure changes**: DevOps team approval
- **Security updates**: Security team approval

---

**Last Updated**: [Current Date]
**Next Review**: [Date + 3 months]
**Owner**: Engineering Team