import { Link } from "react-router-dom";

/**
 * Placeholder landing for Aquilla. The product surface is the on-demand
 * trades marketplace described in the prototype; this repo currently holds
 * the backend engine (Supabase schema + Edge Functions). The full customer
 * and pro apps will be ported on top of these APIs.
 */
const Index = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-100 px-6 text-center">
    <div className="flex items-center gap-2">
      <span className="rounded-xl bg-black p-2 text-white">🔧</span>
      <span className="text-3xl font-extrabold tracking-tight">Aquilla</span>
    </div>
    <p className="max-w-md text-neutral-500">
      Trusted pros for any fix, on demand. Backend engine for an Uber-style
      dispatch marketplace connecting customers with home-service and roadside
      pros.
    </p>
    <Link to="/app" className="text-sm font-semibold underline">
      Open app
    </Link>
  </div>
);

export default Index;
