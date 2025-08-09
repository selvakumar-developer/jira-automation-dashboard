import {
  getOverviewData,
  getOverviewStatusTableData,
} from "@/utils/api/dashboard";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import JiraDashboard from "./components/dashboard/dashboard";

// Example in App Router
export const dynamic = "force-dynamic";

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["overview"],
    queryFn: () => getOverviewData(),
  });

  await queryClient.prefetchQuery({
    queryKey: ["overview-status-table"],
    queryFn: () => getOverviewStatusTableData(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <JiraDashboard />
      </Suspense>
    </HydrationBoundary>
  );
}
