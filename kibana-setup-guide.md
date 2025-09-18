# Kibana Setup Guide for Parscade Application Logging

This guide will help you set up Kibana dashboards and visualizations for monitoring the Parscade application logs stored in Elasticsearch.  

## Prerequisites

- Elasticsearch cluster running at `https://elastic-search.cdubz-hub.com`
- Kibana instance connected to the same Elasticsearch cluster
- Application running with Pino logger sending logs to Elasticsearch

## 1. Index Pattern Creation

### Step 1: Access Kibana Management

1. Open Kibana in your browser
2. Navigate to **Stack Management** → **Index Patterns**
3. Click **Create index pattern**

### Step 2: Create App Logs Index Pattern

1. **Index pattern name**: `app-logs-*`
2. **Time field**: `@timestamp`
3. Click **Create index pattern**

### Step 3: Verify Field Mappings

Ensure these key fields are properly mapped:

```
@timestamp          - date
level               - keyword  
msg                 - text
service             - keyword
env                 - keyword
version             - keyword
context.feature     - keyword
context.action      - keyword
context.userId      - keyword
context.route       - keyword
error.name          - keyword
error.message       - text
error.stack         - text
metadata.*          - varies
```

## 2. Essential Searches and Filters

### Basic Application Logs
```
service: "parscade-frontend"
```

### Error Monitoring
```
service: "parscade-frontend" AND level: "error"
```

### Authentication Events
```
service: "parscade-frontend" AND context.feature: "auth"
```

### Specific User Activity
```
service: "parscade-frontend" AND context.userId: "user-123"
```

### Feature Usage Tracking
```
service: "parscade-frontend" AND context.feature: "dashboard" AND context.action: "pageView"
```

### API Errors
```
service: "parscade-frontend" AND context.feature: "api" AND level: "error"
```

### Performance Issues (if you add performance logging)
```
service: "parscade-frontend" AND metadata.loadTime: >2000
```

## 3. Discover Views Setup

### Create Saved Searches

#### 1. Application Errors
- **Name**: "Parscade - All Errors"
- **Query**: `service: "parscade-frontend" AND level: ("error" OR "fatal")`
- **Columns**: `@timestamp`, `level`, `msg`, `context.feature`, `context.action`, `error.name`

#### 2. Authentication Activity
- **Name**: "Parscade - Auth Events"
- **Query**: `service: "parscade-frontend" AND context.feature: "auth"`
- **Columns**: `@timestamp`, `level`, `msg`, `context.action`, `context.userId`, `metadata.loginMethod`

#### 3. User Activity by ID
- **Name**: "Parscade - User Activity"
- **Query**: `service: "parscade-frontend" AND context.userId: *`
- **Columns**: `@timestamp`, `context.userId`, `context.feature`, `context.action`, `context.route`

## 4. Dashboard Creation

### Step 1: Create New Dashboard
1. Go to **Analytics** → **Dashboard**
2. Click **Create new dashboard**
3. Name it "Parscade Application Monitoring"

### Step 2: Add Visualizations

#### A. Error Rate Over Time (Line Chart)
1. **Visualization Type**: Line chart
2. **Index**: `app-logs-*`
3. **Metrics**: 
   - Y-axis: Count
4. **Buckets**:
   - X-axis: Date Histogram on `@timestamp` (Auto interval)
   - Split Series: Terms on `level.keyword` (Include: error, fatal, warn)
5. **Filters**: `service: "parscade-frontend"`

#### B. Top Error Messages (Data Table)
1. **Visualization Type**: Data Table
2. **Metrics**: Count
3. **Buckets**: Terms aggregation on `error.name.keyword` (Top 10)
4. **Filters**: `service: "parscade-frontend" AND level: "error"`

#### C. Feature Usage Distribution (Pie Chart)
1. **Visualization Type**: Pie chart
2. **Metrics**: Count
3. **Buckets**: Terms on `context.feature.keyword`
4. **Filters**: `service: "parscade-frontend"`

#### D. User Activity Heatmap (Heat Map)
1. **Visualization Type**: Heat Map
2. **Metrics**: Unique Count on `context.userId.keyword`
3. **Buckets**: 
   - X-axis: Date Histogram on `@timestamp` (Hourly)
   - Y-axis: Terms on `context.feature.keyword`

#### E. Authentication Success/Failure (Metric)
1. **Visualization Type**: Metric
2. **Metrics**: Count
3. **Filters**: `service: "parscade-frontend" AND context.feature: "auth" AND context.action: "signIn"`
4. Create separate metrics for success vs failure based on log message content

## 5. Alerting Setup

### Error Rate Alert
1. Go to **Stack Management** → **Watcher** (or **Alerting**)
2. Create new alert with conditions:
   - **Index**: `app-logs-*`
   - **Query**: `service: "parscade-frontend" AND level: "error"`
   - **Threshold**: More than 10 errors in 5 minutes
   - **Actions**: Email notification or Slack webhook

### Authentication Failure Alert
1. **Index**: `app-logs-*`
2. **Query**: `service: "parscade-frontend" AND context.feature: "auth" AND level: "error"`
3. **Threshold**: More than 5 auth failures in 1 minute
4. **Actions**: Immediate notification for potential security issues

## 6. Index Templates and Lifecycle Management

### Create Index Template
```json
{
  "index_patterns": ["app-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.refresh_interval": "5s"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "msg": { "type": "text" },
        "service": { "type": "keyword" },
        "env": { "type": "keyword" },
        "version": { "type": "keyword" },
        "context": {
          "properties": {
            "feature": { "type": "keyword" },
            "action": { "type": "keyword" },
            "userId": { "type": "keyword" },
            "route": { "type": "keyword" },
            "userEmail": { "type": "keyword" }
          }
        },
        "error": {
          "properties": {
            "name": { "type": "keyword" },
            "message": { "type": "text" },
            "stack": { "type": "text" }
          }
        },
        "metadata": { "type": "object" }
      }
    }
  }
}
```

### Set up Index Lifecycle Policy
1. **Hot phase**: Keep for 7 days
2. **Warm phase**: Move to warm nodes after 1 day
3. **Cold phase**: Move to cold storage after 30 days
4. **Delete phase**: Delete after 90 days

## 7. Useful KQL Queries for Development

### Debug Development Issues
```
service: "parscade-frontend" AND env: "development" AND level: "debug" AND context.feature: "auth"
```

### Monitor API Performance
```
service: "parscade-frontend" AND metadata.responseTime: >1000
```

### Track User Journey
```
service: "parscade-frontend" AND context.userId: "specific-user-id" | sort @timestamp
```

### Find Recent Errors
```
service: "parscade-frontend" AND level: "error" AND @timestamp: [now-1h TO now]
```

### Monitor Feature Adoption
```
service: "parscade-frontend" AND context.action: "pageView" AND context.route: "/dashboard"
```

## 8. Best Practices

### Query Optimization
- Always include `service: "parscade-frontend"` to filter your app logs
- Use specific time ranges to improve query performance
- Leverage keyword fields for aggregations and exact matches

### Dashboard Performance
- Limit visualizations to essential metrics
- Use appropriate time ranges (don't query all-time by default)
- Set refresh intervals based on your monitoring needs

### Alerting Strategy
- Set up tiered alerts (warning, critical)
- Include context in alert messages
- Test alert conditions during low-traffic periods

### Data Retention
- Monitor index size and growth
- Set appropriate lifecycle policies
- Archive important logs for compliance

## 9. Troubleshooting

### No Data Appearing
1. Check if application is sending logs: `service: "parscade-frontend"`
2. Verify time range in Kibana discovery
3. Confirm index pattern includes `app-logs-*`
4. Check Elasticsearch connectivity from the application

### Performance Issues
1. Use smaller time ranges for complex queries
2. Add more specific filters to reduce data scope
3. Consider using sampled data for heavy aggregations

### Field Mapping Issues
1. Refresh index pattern if new fields appear
2. Check field data types in Index Management
3. Recreate index pattern if mappings are incorrect

## 10. Monitoring Checklist

### Daily Checks
- [ ] Review error dashboard for new issues
- [ ] Check authentication failure rates
- [ ] Monitor application performance metrics

### Weekly Reviews
- [ ] Analyze feature usage trends
- [ ] Review user activity patterns  
- [ ] Update alerts based on new patterns

### Monthly Maintenance
- [ ] Clean up old saved searches and dashboards
- [ ] Review index lifecycle policies
- [ ] Update field mappings for new log fields
- [ ] Archive or export important historical data

This setup will provide comprehensive monitoring capabilities for the Parscade application, helping you identify issues quickly and understand user behavior patterns.
