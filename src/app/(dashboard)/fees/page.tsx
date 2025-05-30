'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFees } from '@/hooks/use-fees'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FeeFilters } from '@/types/fee'
import { formatCurrency } from '@/lib/utils'
import { Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function FeesPage() {
  const [filters, setFilters] = useState<FeeFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const { school } = useAuth()

  const { data: fees, isLoading, error } = useFees(filters)

  // Debug information
  console.log('School:', school)
  console.log('Fees:', fees)
  console.log('Is Loading:', isLoading)
  console.log('Error:', error)

  // Filter fees based on all criteria
  const filteredFees = fees?.filter(fee => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      fee.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.student_admission_number?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = !filters.status || filters.status === 'all' || fee.status === filters.status

    // Date range filter
    const feeDate = new Date(fee.date)
    const matchesStartDate = !filters.startDate || feeDate >= filters.startDate
    const matchesEndDate = !filters.endDate || feeDate <= filters.endDate

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fees</h1>
          <Button asChild>
            <Link href="/fees/new">Add New Fee</Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load fees'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fees</h1>
        <Button asChild>
          <Link href="/fees/new">Add New Fee</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by student name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  startDate: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  endDate: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-1/3 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFees?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No fees found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {school ? `School ID: ${school.id}` : 'No school context available'}
          </p>
          <Button asChild className="mt-4">
            <Link href="/fees/new">Create New Fee</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFees?.map((fee) => (
            <Card key={fee.id} className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fee #{fee.id.slice(0, 8)}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      fee.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : fee.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {fee.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {fee.student_name || 'Unknown Student'}
                    {fee.student_admission_number && (
                      <span className="text-muted-foreground ml-2">
                        ({fee.student_admission_number})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    Amount: {formatCurrency(fee.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(fee.date).toLocaleDateString()}
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/fees/${fee.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 