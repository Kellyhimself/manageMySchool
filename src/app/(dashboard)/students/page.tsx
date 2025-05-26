'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function StudentsPage() {
  const { school, isLoading: isAuthLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')

  useEffect(() => {
    console.log('Auth state:', { school, isAuthLoading })
  }, [school, isAuthLoading])

  const { data: students, isLoading, error } = useStudents({
    schoolId: school?.id,
    search: searchQuery,
    class: classFilter
  })

  useEffect(() => {
    console.log('Students data:', { students, isLoading, error })
  }, [students, isLoading, error])

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p>Loading authentication...</p>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-red-500">No school found. Please make sure you're logged in.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-red-500">Error loading students: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Students</h1>
        <Button asChild>
          <Link href="/students/new">Add New Student</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="search">Search Student</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Filter by Class</Label>
            <Input
              id="class"
              placeholder="Enter class..."
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[30vh] space-y-4">
          <p className="text-muted-foreground">No students found</p>
          <Button asChild>
            <Link href="/students/new">Add Your First Student</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students?.map((student) => (
            <Card key={student.id} className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{student.name}</span>
                  {student.admission_number && (
                    <span className="text-sm text-muted-foreground">
                      #{student.admission_number}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Class: {student.class}</p>
                  <p className="text-sm text-gray-500">Parent Phone: {student.parent_phone}</p>
                  {student.parent_email && (
                    <p className="text-sm text-gray-500">Parent Email: {student.parent_email}</p>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/students/${student.id}`}>View Details</Link>
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