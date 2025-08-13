"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import JobForm from './job-form';
import Calendar from './calendar';
import LoginForm from './login-form';

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <h1 className="text-3xl font-bold tracking-tighter text-foreground">ClearVue Scheduler</h1>
            </div>
            <p className="text-muted-foreground">Sign in to access your schedule</p>
          </div>
          <LoginForm />
        </div>
      </main>
    );
  }

  const isManager = user.role === 'manager';

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">ClearVue Scheduler</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden md:inline">Welcome, {user.name || user.email}</span>
          {isManager && (
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Job
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create New Job</SheetTitle>
                  <SheetDescription>
                    Fill out the details below to schedule a new window installation job.
                  </SheetDescription>
                </SheetHeader>
                <JobForm />
              </SheetContent>
            </Sheet>
          )}
          <Button variant="outline" size="icon" onClick={logout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Calendar user={user} />
      </main>
    </div>
  );
}