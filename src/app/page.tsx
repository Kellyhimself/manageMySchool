import Link from 'next/link'
import { ArrowRight, School, Users, Receipt, BookOpen, Bell, Building2, Pill, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-12 sm-mobile:px-6 md-mobile:px-8 desktop:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm-mobile:text-4xl md-mobile:text-5xl desktop:text-6xl">
              Streamline Your School Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm-mobile:text-xl md-mobile:text-2xl">
              A comprehensive solution for managing fees, students, and communications
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login">
                <Button size="lg" className="bg-[#1E88E5] hover:bg-[#1976D2]">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm-mobile:py-16 md-mobile:py-20">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm-mobile:text-3xl md-mobile:text-4xl">
              Key Features
            </h2>
          </div>
          <div className="mt-12 space-y-4">
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Student Management"
              description="Efficiently manage student records, admissions, and academic progress"
            />
            <FeatureCard
              icon={<Receipt className="h-6 w-6" />}
              title="Fee Management"
              description="Streamline fee collection, generate receipts, and track payments"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Communication"
              description="Send notifications to parents via SMS and email"
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Exam Management"
              description="Track exam results and generate report cards"
            />
          </div>
        </div>
      </section>

      {/* Other Projects Section */}
      <section className="bg-gray-50 py-12 sm-mobile:py-16 md-mobile:py-20">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm-mobile:text-3xl md-mobile:text-4xl">
              Our Other Solutions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover our range of business management solutions
            </p>
          </div>
          <div className="mt-12 space-y-4">
            <ProjectCard
              icon={<Pill className="h-6 w-6" />}
              title="Clinic Management"
              description="Complete pharmacy inventory and clinic management system"
              link="https://clinic.veylor360.com"
            />
            <ProjectCard
              icon={<Leaf className="h-6 w-6" />}
              title="Agrovet Management"
              description="Streamline your agrovet sales and inventory"
              link="https://agrovet.veylor360.com"
            />
            <ProjectCard
              icon={<Building2 className="h-6 w-6" />}
              title="Veylor360"
              description="Visit our main website for more solutions"
              link="https://veylor360.com"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Veylor360. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg transition-all hover:shadow-xl sm-mobile:p-5 md-mobile:p-6">
      <div className="flex-shrink-0 rounded-full bg-blue-50 p-3 text-[#1E88E5]">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 sm-mobile:text-xl md-mobile:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 sm-mobile:text-base md-mobile:text-lg">{description}</p>
      </div>
    </div>
  )
}

function ProjectCard({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg transition-all hover:shadow-xl sm-mobile:p-5 md-mobile:p-6"
    >
      <div className="flex-shrink-0 rounded-full bg-green-50 p-3 text-[#2ECC71] group-hover:text-[#27AE60]">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 sm-mobile:text-xl md-mobile:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 sm-mobile:text-base md-mobile:text-lg">{description}</p>
      </div>
    </a>
  )
}
