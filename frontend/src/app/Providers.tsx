"use client";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import React, { useState} from "react";

export function Providers({ children }: { children: React.ReactNode }) {
// UseState prevent that QueryClient recreate each render
const [queryClient] = useState(() => new QueryClient());

return (
    <SessionProvider>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </SessionProvider>
);

}



