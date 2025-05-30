'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { sendBulkMessage, getCommunications } from '@/app/actions/communications'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { Search } from 'lucide-react'

interface Communication {
  id: string
  message: string
  type: 'sms' | 'email'
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  createdAt: Date
  recipients: number
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  description?: string
}

export default function CommunicationsPage() {
  const { school } = useAuth()
  const { data: students = [], isLoading: isLoadingStudents } = useStudents()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [message, setMessage] = useState('')
  const [communicationType, setCommunicationType] = useState<'sms' | 'email'>('sms')
  const [communications, setCommunications] = useState<Communication[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')

  // Get unique classes from students
  const classes = useMemo(() => {
    const uniqueClasses = new Set(students.map(student => student.class))
    return Array.from(uniqueClasses).sort()
  }, [students])

  // Filter students based on search query and selected class
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClass = selectedClass === 'all' || student.class === selectedClass
      return matchesSearch && matchesClass
    })
  }, [students, searchQuery, selectedClass])

  // Handle select all for filtered students
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    filteredStudents.forEach(student => {
      if (checked) {
        newSelected.add(student.id)
      } else {
        newSelected.delete(student.id)
      }
    })
    setSelectedStudents(newSelected)
  }

  // Check if all filtered students are selected
  const areAllFilteredSelected = useMemo(() => {
    return filteredStudents.length > 0 && filteredStudents.every(student => selectedStudents.has(student.id))
  }, [filteredStudents, selectedStudents])

  const handleSendMessage = async () => {
    if (!school) {
      toast.error("School context is required")
      return
    }

    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one recipient")
      return
    }

    try {
      const result = await sendBulkMessage({
        message,
        type: communicationType,
        recipientIds: Array.from(selectedStudents),
        schoolId: school.id
      })

      if (result.success) {
        toast.success("Message sent successfully")
        setMessage('')
        setSelectedStudents(new Set())
        // Refresh communications list
        const updatedCommunications = await getCommunications(school.id)
        setCommunications(updatedCommunications)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  const handleAddEvent = () => {
    if (!selectedDate) return
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: 'New Event',
      date: selectedDate,
      description: 'Event description'
    }
    setEvents([...events, newEvent])
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Communications</h1>
      
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Bulk Messages</TabsTrigger>
          <TabsTrigger value="history">Communication History</TabsTrigger>
          <TabsTrigger value="calendar">School Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={communicationType}
                  onValueChange={(value: 'sms' | 'email') => setCommunicationType(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Select Recipients ({selectedStudents.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select Recipients</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        <Select
                          value={selectedClass}
                          onValueChange={setSelectedClass}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((className) => (
                              <SelectItem key={className} value={className}>
                                {className}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all"
                          checked={areAllFilteredSelected}
                          onCheckedChange={handleSelectAll}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Select All ({filteredStudents.length})
                        </label>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {isLoadingStudents ? (
                            <div className="text-center py-4">Loading students...</div>
                          ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-4">No students found</div>
                          ) : (
                            filteredStudents.map((student) => (
                              <div key={student.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={student.id}
                                  checked={selectedStudents.has(student.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedStudents)
                                    if (checked) {
                                      newSelected.add(student.id)
                                    } else {
                                      newSelected.delete(student.id)
                                    }
                                    setSelectedStudents(newSelected)
                                  }}
                                />
                                <label
                                  htmlFor={student.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {student.name}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {communicationType === 'sms' ? student.parent_phone : student.parent_email}
                                  </span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              
              <Button onClick={handleSendMessage} className="w-full">
                Send Message
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm">{comm.message}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{comm.type}</Badge>
                        <Badge variant={comm.status === 'sent' ? 'default' : 'secondary'}>
                          {comm.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(comm.createdAt, 'PPp')}
                        </span>
        </div>
      </div>
                    <span className="text-sm text-muted-foreground">
                      {comm.recipients} recipients
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              <Button onClick={handleAddEvent} className="mt-4 w-full">
                Add Event
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Upcoming Events</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(event.date, 'PPP')}
                      </p>
                      {event.description && (
                        <p className="text-sm mt-2">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 