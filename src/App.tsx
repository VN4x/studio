import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Dashboard from '@/components/dashboard';

function App() {
  return (
    <AuthProvider>
      <Dashboard />
      <Toaster />
    </AuthProvider>
  );
}

export default App;