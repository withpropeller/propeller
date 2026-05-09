import { Route, Routes, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from './components/Layout.js';
import { KybQueue } from './components/KybQueue.js';
import { BusinessList } from './components/BusinessList.js';
import { BusinessDetail } from './components/BusinessDetail.js';
import { api } from './api/client.js';

function KybQueuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses(),
  });
  return (
    <Layout>
      <KybQueue businesses={data ?? []} isLoading={isLoading} />
    </Layout>
  );
}

function BusinessListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses(),
  });
  return (
    <Layout>
      <BusinessList businesses={data ?? []} isLoading={isLoading} />
    </Layout>
  );
}

function BusinessDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.getBusiness(id),
  });

  const mutation = useMutation({
    mutationFn: ({ action, reason }: { action: string; reason?: string }) =>
      api.approveBusiness(id, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  if (isLoading || !data) {
    return (
      <Layout>
        <div style={{ padding: '2rem', color: '#6b7280' }}>Loading business…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BusinessDetail
        business={data}
        onAction={(_bizId, action, reason) => mutation.mutate({ action, reason })}
        isMutating={mutation.isPending}
      />
    </Layout>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<KybQueuePage />} />
      <Route path="/businesses" element={<BusinessListPage />} />
      <Route path="/businesses/:id" element={<BusinessDetailRoute />} />
    </Routes>
  );
}

function BusinessDetailRoute() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Layout><div style={{ padding: '2rem', color: '#6b7280' }}>Business not found.</div></Layout>;
  return <BusinessDetailPage id={id} />;
}
