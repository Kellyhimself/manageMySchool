# School Management System Development Plan

## Overview
This document outlines the development plan for a hybrid school management system tailored for Kenyan private schools. The system will be built using TypeScript, Next.js, TanStack Query, and Supabase, with a focus on maintainability, scalability, and type safety. The UI will be built with Tailwind CSS for responsive design and consistent styling.

## Tech Stack

### Core Technologies
- **Frontend Framework**: Next.js 14+ with TypeScript
- **State Management & Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Database**: 
  - Core Version: SQLite
  - Subscription Version: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Integration**: M-Pesa (Safaricom Daraja API)
- **Notifications**: 
  - SMS: Africa's Talking
  - Email: SendGrid
- **PDF Generation**: pdfkit
- **Deployment**: 
  - Core Version: Local/AWS EC2
  - Subscription Version: AWS Amplify

## Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── supabase/        # Supabase client and types
│   ├── mpesa/           # M-Pesa integration
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── types/              # TypeScript type definitions
├── services/           # API service functions
└── styles/            # Global styles and CSS modules
```

## Tailwind CSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'sm-mobile': '359px',    // Small-Medium Mobile
        'md-mobile': '410px',    // Medium Mobile
        'desktop': '481px',      // Desktop
      },
    },
  },
  plugins: [],
}

export default config
```

## Responsive Design Guidelines

### Breakpoints
- **Small Mobile**: width <= 358px
- **Small-Medium Mobile**: width > 358px && width <= 409px
- **Medium Mobile**: width > 409px && width <= 480px
- **Desktop**: width > 480px

### Usage in Components
```typescript
// Example of responsive component using Tailwind CSS
export function ResponsiveComponent() {
  return (
    <div className="
      // Base styles (Small Mobile)
      p-2 text-sm
      
      // Small-Medium Mobile
      sm-mobile:p-3 sm-mobile:text-base
      
      // Medium Mobile
      md-mobile:p-4 md-mobile:text-lg
      
      // Desktop
      desktop:p-6 desktop:text-xl
    ">
      Content
    </div>
  )
}
```

### Common Responsive Patterns
1. **Grid Layouts**
```typescript
<div className="
  grid grid-cols-1 gap-2
  sm-mobile:grid-cols-2
  md-mobile:grid-cols-3
  desktop:grid-cols-4
">
  {/* Grid items */}
</div>
```

2. **Navigation**
```typescript
<nav className="
  flex flex-col
  desktop:flex-row
">
  {/* Navigation items */}
</nav>
```

3. **Forms**
```typescript
<form className="
  w-full max-w-[280px] mx-auto
  sm-mobile:max-w-[320px]
  md-mobile:max-w-[400px]
  desktop:max-w-[500px]
">
  {/* Form fields */}
</form>
```

## TypeScript Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## TanStack Query Integration

### Query Client Setup
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

### Query Provider Setup
```typescript
// src/app/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

## Type Definitions

### Student Types
```typescript
// src/types/student.ts
export interface Student {
  id: string
  name: string
  class: string
  parentPhone: string
  parentEmail: string
  createdAt: Date
}

export interface CreateStudentDTO {
  name: string
  class: string
  parentPhone: string
  parentEmail: string
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: string
}
```

### Fee Types
```typescript
// src/types/fee.ts
export interface Fee {
  id: string
  studentId: string
  amount: number
  date: Date
  status: 'pending' | 'paid' | 'overdue'
  receiptUrl?: string
}

export interface CreateFeeDTO {
  studentId: string
  amount: number
  date: Date
}
```

## API Service Functions

### Student Service
```typescript
// src/services/student.service.ts
import { supabase } from '@/lib/supabase'
import type { Student, CreateStudentDTO, UpdateStudentDTO } from '@/types/student'

export const studentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
    
    if (error) throw error
    return data as Student[]
  },

  async create(student: CreateStudentDTO) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single()
    
    if (error) throw error
    return data as Student
  },

  async update(student: UpdateStudentDTO) {
    const { data, error } = await supabase
      .from('students')
      .update(student)
      .eq('id', student.id)
      .select()
      .single()
    
    if (error) throw error
    return data as Student
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
```

## React Query Hooks

### Student Hooks
```typescript
// src/hooks/use-students.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService } from '@/services/student.service'
import type { CreateStudentDTO, UpdateStudentDTO } from '@/types/student'

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: studentService.getAll
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    }
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: studentService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    }
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    }
  })
}
```

## Component Examples

### Student List Component with Responsive Design
```typescript
// src/components/students/student-list.tsx
'use client'

import { useStudents } from '@/hooks/use-students'

export function StudentList() {
  const { data: students, isLoading, error } = useStudents()

  if (isLoading) return <div className="p-4 text-center">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>

  return (
    <div className="
      grid grid-cols-1 gap-4 p-2
      sm-mobile:grid-cols-2 sm-mobile:gap-6 sm-mobile:p-3
      md-mobile:grid-cols-3 md-mobile:gap-8 md-mobile:p-4
      desktop:grid-cols-4 desktop:gap-10 desktop:p-6
    ">
      {students?.map(student => (
        <div key={student.id} className="
          bg-white rounded-lg shadow p-3
          sm-mobile:p-4
          md-mobile:p-5
          desktop:p-6
        ">
          <h3 className="
            text-lg font-semibold mb-2
            sm-mobile:text-xl
            md-mobile:text-2xl
            desktop:text-3xl
          ">{student.name}</h3>
          <p className="
            text-sm text-gray-600
            sm-mobile:text-base
            md-mobile:text-lg
            desktop:text-xl
          ">Class: {student.class}</p>
          <p className="
            text-sm text-gray-600
            sm-mobile:text-base
            md-mobile:text-lg
            desktop:text-xl
          ">Parent Phone: {student.parentPhone}</p>
        </div>
      ))}
    </div>
  )
}
```

## Development Phases

### Phase 1: Project Setup and Authentication (Week 1)
- Initialize Next.js project with TypeScript
- Set up Supabase project and authentication
- Configure TanStack Query
- Create basic project structure
- Implement authentication flows

### Phase 2: Student Management (Week 2)
- Create student database schema
- Implement student CRUD operations
- Build student management UI
- Add form validation
- Implement search and filtering

### Phase 3: Fee Management (Week 3)
- Set up fee database schema
- Implement M-Pesa integration
- Create fee payment UI
- Generate and store receipts
- Add payment history tracking

### Phase 4: Exam and Results (Week 4)
- Create exam database schema
- Build exam result entry system
- Implement report card generation
- Add result analytics
- Create PDF export functionality

### Phase 5: Notifications (Week 5)
- Set up Africa's Talking integration
- Configure SendGrid for emails
- Implement notification triggers
- Create notification templates
- Add notification preferences

### Phase 6: Testing and Deployment (Week 6)
- Write unit tests
- Perform integration testing
- Set up CI/CD pipeline
- Deploy to AWS Amplify
- Configure production environment

## Best Practices

### TypeScript
- Use strict type checking
- Define interfaces for all data structures
- Avoid using `any` type
- Use type guards for runtime type checking
- Leverage TypeScript's utility types

### TanStack Query
- Use appropriate cache times
- Implement optimistic updates
- Handle loading and error states
- Use query invalidation strategically
- Implement infinite queries for pagination

### Tailwind CSS
- Use the defined breakpoints consistently
- Follow mobile-first approach
- Utilize Tailwind's utility classes for responsive design
- Create reusable component classes
- Use Tailwind's dark mode when needed
- Implement consistent spacing and typography scales

### Code Organization
- Follow the project structure strictly
- Keep components small and focused
- Use custom hooks for complex logic
- Implement proper error handling
- Write meaningful comments

### Performance
- Implement proper caching strategies
- Use React.memo for expensive components
- Optimize images and assets
- Implement code splitting
- Use proper loading states
- Optimize Tailwind CSS bundle size

## Deployment Strategy

### Core Version
1. Build the application
2. Package with Electron for desktop use
3. Create installation package
4. Set up auto-updates

### Subscription Version
1. Set up AWS Amplify project
2. Configure environment variables
3. Set up CI/CD pipeline
4. Configure custom domain
5. Set up monitoring and logging

## Monitoring and Maintenance

### Monitoring
- Set up error tracking (e.g., Sentry)
- Implement performance monitoring
- Set up uptime monitoring
- Configure alerting

### Maintenance
- Regular dependency updates
- Security patches
- Performance optimization
- Database maintenance
- Backup strategy

## Future Enhancements
- Mobile app development
- Advanced analytics
- Parent portal
- Teacher portal
- Integration with other school systems
- Advanced reporting features
- Bulk operations
- Custom workflows
- API for third-party integrations 

Recommended Color Theme
Based on psychology, Kenyan context, and UX needs, here’s the optimal color theme for your app:
Primary Color: Blue (#1E88E5)
Why: Conveys trust, reliability, and professionalism, aligning with educational and tech contexts. Appeals to school owners and parents seeking a dependable system.

Use: Headers, navigation bars, primary buttons (e.g., “Save Student”), dashboard backgrounds.

Psychology: Blue reduces stress and builds confidence, critical for admins managing fees and parents receiving notifications.

Hex: #1E88E5 (vibrant yet professional, contrasts well with white).

Secondary Color: Green (#2ECC71)
Why: Evokes success, growth, and financial trust, tying to M-Pesa’s branding and fee management. Resonates with Kenyan users and signals educational progress.

Use: Fee management UI (e.g., payment confirmation), notification alerts, success messages (e.g., “Payment Received”).

Psychology: Green promotes positivity and action, ideal for financial and learning-related features.

Hex: #2ECC71 (M-Pesa-inspired, vibrant but not overpowering).

Accent Color: Orange (#F39C12)
Why: Adds energy and draws attention to CTAs (e.g., “Pay Now,” “Send Notification”). Complements blue and green without clashing.

Use: Buttons (e.g., “Generate Report Card”), alerts for urgent actions (e.g., overdue fees), hover effects.

Psychology: Orange boosts engagement by 15–20% for CTAs (per UX studies), encouraging user interaction.

Hex: #F39C12 (warm, attention-grabbing, culturally vibrant).

Neutral Colors: White (#FFFFFF) and Gray (#4A4A4A)
Why: White ensures a clean, modern look for forms and dashboards, while gray provides balance and readability for text and borders.

Use:
White: Backgrounds, cards (e.g., student profiles, report cards).

Gray: Secondary text, borders, subtle UI elements (e.g., form outlines).

Psychology: White simplifies the interface, reducing cognitive load for busy admins. Gray supports accessibility (high contrast with white).

Hex: #FFFFFF (pure white), #4A4A4A (dark gray for text).

Error/Alert Color: Red (#E74C3C)
Why: Signals urgency for errors (e.g., invalid form input, failed payment). Used sparingly to avoid anxiety.

Use: Error messages, overdue fee alerts.

Hex: #E74C3C (bright but not aggressive).


npx supabase gen types typescript --project-id xstmlowercjuvqkhfbpk --schema public > src/types/supabase.ts

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

I lauched the app while online then switched to offline, then I tried to visit the /fees page while in that offline mode and it did not populate the fee cards. Is that something to do with the @use-fees.ts and the @fee.service.ts  not being offline or what? Or is it the Tanstack query provider or the @providers.tsx  which is wporking perfectly when online ?



3. why is the tab bar/tab header or tab header container not displaying the other available tabs when on small screens, neither is it scrollable to tell the user if more tabs are available on horizontal scroll, in the /fees page. Take care because the other cards are supposed to be equal width with the screen sizes which is perfect at the moment, so dont change the whole container, just find a way to alter and make the tab header display all the tabs in small screen sizes. You may consider using a collapsible feature or change the tab header layout to one column grid on small devices below 480px. Or just make the tab bar scrollable without altering the other cards styling as they are responsive to screen sizes already.


1. on screen above 480 px, the financial metrics cards should display in more grid columns eg 3 or for columns, not as it is
2. style the tabtrigger container in the /fees page to have its nested elemnts scrollable but in one row even on smal screens