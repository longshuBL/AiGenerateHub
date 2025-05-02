import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  data?: any,
  options?: RequestInit
) {
  const url = path.startsWith('http') ? path : path;
  
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
    body: data ? JSON.stringify(data) : undefined,
  };
  
  const response = await fetch(url, init);
  
  if (response.status === 401) {
    console.warn('Authentication required');
  }
  
  return response;
}

export async function fetchCredits() {
  const res = await apiRequest('GET', '/api/credits');
  if (!res.ok) {
    throw new Error('Failed to fetch credits');
  }
  const data = await res.json();
  return data.credits;
}

export async function consumeCredits(amount: number, service: string) {
  const res = await apiRequest('POST', '/api/credits/consume', { amount, service });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to consume credits');
  }
  
  const data = await res.json();
  return data.credits;
}

export async function addRewardCredits() {
  const res = await apiRequest('POST', '/api/credits/reward');
  if (!res.ok) {
    throw new Error('Failed to add reward credits');
  }
  
  const data = await res.json();
  return data.credits;
}

export async function fetchTransactions() {
  const res = await apiRequest('GET', '/api/transactions');
  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }
  
  return res.json();
}

export async function purchaseCredits(amount: number, packageName: string) {
  const res = await apiRequest('POST', '/api/credits/purchase', { 
    amount, 
    package: packageName 
  });
  
  if (!res.ok) {
    throw new Error('Failed to purchase credits');
  }
  
  const data = await res.json();
  return data.credits;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
