import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  responseTime?: number
  uptime?: number
  lastUpdated: string
}

async function getServiceStatuses(): Promise<ServiceStatus[]> {
  // In production, this would fetch real status data
  return [
    {
      name: 'Web Application',
      status: 'operational',
      responseTime: 120,
      uptime: 99.98,
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'API Services',
      status: 'operational',
      responseTime: 89,
      uptime: 99.95,
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'Image Processing',
      status: 'operational',
      responseTime: 2340,
      uptime: 99.92,
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'Payment System',
      status: 'operational',
      responseTime: 156,
      uptime: 99.99,
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'Database',
      status: 'operational',
      responseTime: 45,
      uptime: 99.97,
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'File Storage',
      status: 'operational',
      responseTime: 78,
      uptime: 99.94,
      lastUpdated: new Date().toISOString()
    }
  ]
}

function StatusIcon({ status }: { status: ServiceStatus['status'] }) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'degraded':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case 'outage':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'maintenance':
      return <Clock className="h-5 w-5 text-blue-500" />
  }
}

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
  const variants = {
    operational: 'bg-green-50 text-green-700 border-green-200',
    degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    outage: 'bg-red-50 text-red-700 border-red-200',
    maintenance: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

async function ServiceStatusList() {
  const services = await getServiceStatuses()
  
  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.name}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusIcon status={service.status} />
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(service.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {service.responseTime && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{service.responseTime}ms</p>
                    <p className="text-xs text-gray-500">Response time</p>
                  </div>
                )}
                {service.uptime && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{service.uptime}%</p>
                    <p className="text-xs text-gray-500">30-day uptime</p>
                  </div>
                )}
                <StatusBadge status={service.status} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mt-2" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StatusPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="text-gray-600 mt-2">
          Current status and performance metrics for all services
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle className="text-xl">All Systems Operational</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            All services are running normally with no reported issues.
          </p>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Status</h2>
        <Suspense fallback={<StatusSkeleton />}>
          <ServiceStatusList />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">System Maintenance Complete</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Scheduled maintenance for image processing pipeline completed successfully.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Performance Improvements</span>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Deployed optimizations to reduce API response times by 15%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}