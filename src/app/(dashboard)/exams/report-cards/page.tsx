'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudents } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAndSendReportCards } from '@/services/report-card.service';

export default function ReportCardsPage() {
  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const { school, isLoading: isLoadingAuth } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [notificationType, setNotificationType] = useState<'sms' | 'email' | 'both'>('both');
  const [isGenerating, setIsGenerating] = useState(false);

  const isLoading = isLoadingStudents || isLoadingAuth;

  // Get unique classes from students
  const classes = Array.from(new Set(students.map(student => student.class))).sort();

  // Filter students based on search query and selected class
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Handle select all for filtered students
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    filteredStudents.forEach(student => {
      if (checked) {
        newSelected.add(student.id);
      } else {
        newSelected.delete(student.id);
      }
    });
    setSelectedStudents(newSelected);
  };

  // Check if all filtered students are selected
  const areAllFilteredSelected = filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedStudents.has(student.id));

  const handleGenerateAndSend = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!school?.id) {
      toast.error('School information not available');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAndSendReportCards(
        school.id,
        Array.from(selectedStudents),
        selectedTerm,
        selectedYear,
        notificationType
      );

      if (result.success) {
        toast.success('Report cards generated and sent successfully');
        setSelectedStudents(new Set());
      } else {
        toast.error(result.error || 'Failed to generate and send report cards');
      }
    } catch (error) {
      toast.error('An error occurred while generating report cards');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Report Cards</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input
                    type="text"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="e.g., 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
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
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select value={notificationType} onValueChange={(value: 'sms' | 'email' | 'both') => setNotificationType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="both">Both SMS & Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
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

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-4">No students found</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={student.id}
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedStudents);
                              if (checked) {
                                newSelected.add(student.id);
                              } else {
                                newSelected.delete(student.id);
                              }
                              setSelectedStudents(newSelected);
                            }}
                          />
                          <label
                            htmlFor={student.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {student.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              {student.class}
                            </span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Button 
                onClick={handleGenerateAndSend}
                disabled={selectedStudents.size === 0 || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report Cards...
                  </>
                ) : (
                  `Generate & Send Report Cards (${selectedStudents.size})`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 