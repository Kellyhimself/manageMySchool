'use client'

import { useState } from 'react'
import { useStudents } from '@/hooks/use-students'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'

interface StudentSearchProps {
  onSelect: (student: { id: string; name: string } | null) => void
  selectedStudent: { id: string; name: string } | null
}

export function StudentSearch({ onSelect, selectedStudent }: StudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: students, isLoading } = useStudents({
    search: searchQuery,
    schoolId: '1' // TODO: Get from auth context
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search Student</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {selectedStudent && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedStudent.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
            >
              Change
            </Button>
          </div>
        </Card>
      )}

      {!selectedStudent && searchQuery && (
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : students?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            <div className="grid gap-2">
              {students?.map((student) => (
                <Card
                  key={student.id}
                  className="cursor-pointer p-4 hover:bg-accent"
                  onClick={() => onSelect({ id: student.id, name: student.name })}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">Class: {student.class}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 