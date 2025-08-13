import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <h1 className="text-3xl font-bold tracking-tighter text-foreground">ClearVue Scheduler</h1>
            </div>
            <p className="text-muted-foreground">Sign in to access your schedule</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
