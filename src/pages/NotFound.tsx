import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background paper-texture">
      <div className="text-center">
        <h1 className="mb-3 font-serif text-5xl font-medium tracking-tight text-foreground">404</h1>
        <p className="mb-5 text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
