import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import RsvpPage from "@/RsvpPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const isRsvp = typeof window !== "undefined" && window.location.pathname.startsWith("/rsvp/");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {isRsvp ? <RsvpPage /> : <App />}
    </QueryClientProvider>
  </React.StrictMode>,
);
