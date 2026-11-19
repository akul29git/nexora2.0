import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <Dashboard />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;