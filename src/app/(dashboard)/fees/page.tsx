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
import { Search, DollarSign, TrendingUp, AlertCircle, Receipt, School, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function FeesPage() {
  const [filters, setFilters] = useState<FeeFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isMetricsOpen, setIsMetricsOpen] = useState(false)
  const { school, user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data: fees, isLoading, error } = useFees(filters)

  // Filter fees based on all criteria
  const filteredFees = fees?.filter(fee => {
    const matchesSearch = !searchQuery || 
      fee.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.student_admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !filters.status || filters.status === 'all' || fee.status === filters.status
    const feeDate = new Date(fee.date)
    const matchesStartDate = !filters.startDate || feeDate >= filters.startDate
    const matchesEndDate = !filters.endDate || feeDate <= filters.endDate
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  // Calculate financial metrics
  const totalPendingFees = filteredFees?.filter(fee => fee.status === 'pending')
    .reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0
  const totalRevenue = filteredFees?.filter(fee => fee.status === 'paid')
    .reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Fees</h1>
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
    <div className="space-y-6 px-2 sm-mobile:px-4 md-mobile:px-6 desktop:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm-mobile:text-3xl md-mobile:text-4xl font-bold">Fees</h1>
        <Button asChild>
          <Link href="/fees/new">Add New Fee</Link>
        </Button>
      </div>

      {isAdmin && (
        <Collapsible
          open={isMetricsOpen}
          onOpenChange={setIsMetricsOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2 text-base sm-mobile:text-lg md-mobile:text-xl desktop:text-2xl">
              <span>Financial Metrics</span>
              {isMetricsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm-mobile:grid-cols-2 md-mobile:grid-cols-3 desktop:grid-cols-4">
              <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Total Pending Fees</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold break-words">{formatCurrency(totalPendingFees)}</div>
                </CardContent>
              </Card>
              <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold break-words">{formatCurrency(totalRevenue)}</div>
                </CardContent>
              </Card>
              <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">School Expenditure</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold break-words">{formatCurrency(0)}</div>
                </CardContent>
              </Card>
              <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Net Profit</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold break-words">{formatCurrency(totalRevenue - 0)}</div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Tabs defaultValue="student-fees" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="w-full flex gap-2 min-w-max">
            <TabsTrigger value="student-fees">Student Fees</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
                <TabsTrigger value="expenditure">Expenditure</TabsTrigger>
                <TabsTrigger value="reports">Financial Reports</TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="student-fees" className="space-y-4">
          <Collapsible
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2 text-base sm-mobile:text-lg md-mobile:text-xl desktop:text-2xl">
                <span>Filters</span>
                {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <Card>
                <CardContent className="grid grid-cols-1 gap-4 sm-mobile:grid-cols-2 md-mobile:grid-cols-3 desktop:grid-cols-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="text-base">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by student name or admission number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-base">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger className="text-base">
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
                    <Label htmlFor="startDate" className="text-base">Start Date</Label>
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
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-base">End Date</Label>
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
                      className="text-base"
                    />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
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
          ) : !filteredFees?.length ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No fees found</p>
              <p className="text-base text-muted-foreground mt-2">
                {school ? `School ID: ${school.id}` : 'No school context available'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/fees/new">Create New Fee</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
              {filteredFees?.map((fee) => (
                <Card key={fee.id} className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base sm-mobile:text-lg md-mobile:text-xl">
                      <span>Fee #{fee.id.slice(0, 8)}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs sm-mobile:text-sm md-mobile:text-base ${
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
                      <p className="text-base font-medium">
                        {fee.student_name || 'Unknown Student'}
                        {fee.student_admission_number && (
                          <span className="text-muted-foreground ml-2">
                            #{fee.student_admission_number}
                          </span>
                        )}
                      </p>
                      <p className="text-sm sm-mobile:text-base text-muted-foreground">
                        Amount: {formatCurrency(fee.amount)}
                      </p>
                      <p className="text-sm sm-mobile:text-base text-muted-foreground">
                        Due Date: {new Date(fee.date).toLocaleDateString()}
                      </p>
                      <Button asChild variant="outline" className="w-full text-sm sm-mobile:text-base">
                        <Link href={`/fees/${fee.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Revenue analysis content will be added here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenditure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expenditure Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Expenditure management content will be added here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Financial reports content will be added here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
} 