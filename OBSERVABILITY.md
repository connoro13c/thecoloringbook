# Observability Integration

## Overview

The ProgressiveLogger provides comprehensive business intelligence and monitoring for the AI generation pipeline. Every user interaction, generation request, and error is tracked to provide insights into usage patterns, costs, and performance.

## Database Schema

```sql
CREATE TABLE generation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  job_id text,
  style text,
  difficulty integer,
  duration_ms integer,
  costs jsonb,
  tokens jsonb,
  success boolean,
  error_message text,
  created_at timestamp DEFAULT now()
);
```

## Key Metrics Tracked

### Business Intelligence
- **User Behavior**: Most popular styles, difficulty levels, scene types
- **Revenue Insights**: Cost per generation, high-value users, conversion patterns
- **Usage Patterns**: Peak hours, generation frequency, user retention

### Performance Monitoring
- **API Response Times**: OpenAI Vision analysis, image generation, storage
- **Cost Tracking**: Exact OpenAI costs per user and generation
- **Error Rates**: Failed generations, API timeouts, rate limits

### Technical Health
- **Token Usage**: Input/output tokens for cost optimization
- **Success Rates**: Which combinations work best
- **Error Analysis**: Common failure points for improvement

## Configuration

### Development Testing
```bash
# Enable observability in development
export ENABLE_OBSERVABILITY_LOGGING=true

# Test the integration
npx tsx scripts/test-observability.ts
```

### Production Setup
Observability is automatically enabled in production (`NODE_ENV=production`).

### Optional: Datadog Integration
For advanced analytics and alerting:
```bash
export DATADOG_API_KEY=your_datadog_api_key
```

## Usage

The logger is automatically integrated into the generation pipeline:

```typescript
// Automatic logging in GenerationService
const logger = new ProgressiveLogger(user.id)
logger.startJob({ style, difficulty, scene, photoSize })

// ... generation steps ...

logger.completeJob() // Sends metrics to observability sink
```

## Query Examples

### Business Intelligence Queries

```sql
-- Top performing styles by success rate
SELECT 
  style,
  COUNT(*) as total_generations,
  AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
  AVG((costs->>'total')::numeric) as avg_cost
FROM generation_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY style
ORDER BY success_rate DESC;

-- User engagement patterns
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as generations,
  COUNT(DISTINCT user_id) as unique_users
FROM generation_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

-- Cost analysis by difficulty
SELECT 
  difficulty,
  COUNT(*) as generations,
  AVG((costs->>'total')::numeric) as avg_cost,
  SUM((costs->>'total')::numeric) as total_cost
FROM generation_logs 
WHERE success = true
GROUP BY difficulty
ORDER BY difficulty;
```

### Performance Monitoring

```sql
-- Average response times by style
SELECT 
  style,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
FROM generation_logs 
WHERE success = true
AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY style;

-- Error rates and common failures
SELECT 
  error_message,
  COUNT(*) as error_count,
  AVG(duration_ms) as avg_failure_time
FROM generation_logs 
WHERE success = false
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY error_count DESC;
```

## Alerts & Monitoring

### Recommended Alerts
- **High Error Rate**: > 5% failures in 15 minutes
- **Slow Response**: P95 > 30 seconds
- **Cost Spike**: 50% increase in hourly costs
- **API Failures**: OpenAI rate limit errors

### Dashboards
Key metrics to monitor:
1. **Generations per hour** - Usage trends
2. **Success rate %** - Service health  
3. **Average cost per generation** - Economic efficiency
4. **User retention** - Product-market fit

## Privacy & Compliance

- **User Data**: Only UUIDs stored, no personal information
- **Retention**: Logs retained for 90 days for analytics
- **Anonymization**: Can aggregate data without user identification
- **GDPR**: User can request deletion of their generation logs

## Benefits

### For Product Development
- **Feature Prioritization**: Data-driven decisions on new styles/features
- **User Experience**: Identify and fix pain points in generation flow
- **Performance Optimization**: Target slow API calls or high-cost operations

### For Business Growth
- **Pricing Strategy**: Understand true costs and optimal pricing
- **Marketing Insights**: Which features drive engagement and donations
- **Capacity Planning**: Predict infrastructure needs based on usage patterns

### For Technical Operations
- **Proactive Monitoring**: Catch issues before users notice
- **Cost Management**: Track and optimize OpenAI spending
- **Quality Assurance**: Monitor generation success rates and user satisfaction
