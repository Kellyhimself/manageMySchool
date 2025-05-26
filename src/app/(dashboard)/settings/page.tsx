'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, School, Bell, Shield } from 'lucide-react';
import Link from 'next/link';

const settingsSections = [
  {
    title: 'Bank API Settings',
    description: 'Configure bank integration settings for payment processing',
    icon: CreditCard,
    href: '/settings/bank-settings'
  },
  {
    title: 'School Profile',
    description: 'Manage your school information and settings',
    icon: School,
    href: '/admin/settings/school-profile'
  },
  {
    title: 'Notification Settings',
    description: 'Configure email and SMS notification preferences',
    icon: Bell,
    href: '/admin/settings/notifications'
  },
  {
    title: 'Security Settings',
    description: 'Manage security preferences and access controls',
    icon: Shield,
    href: '/admin/settings/security'
  }
];

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-2 hover:border-yellow-400 hover:bg-transparent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <section.icon className="h-6 w-6" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 