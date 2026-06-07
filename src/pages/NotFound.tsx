import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-neutral-100 text-center">
    <h1 className="text-5xl font-extrabold">404</h1>
    <p className="text-neutral-500">This page doesn&apos;t exist.</p>
    <Link to="/" className="text-sm font-semibold underline">
      Back home
    </Link>
  </div>
);

export default NotFound;
