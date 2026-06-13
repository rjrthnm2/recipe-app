import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import usePageTitle from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-[#e2e8f0] bg-[#F8FAFC] px-8 py-16 text-center">
      <p className="font-heading text-5xl" aria-hidden="true">
        🍳
      </p>
      <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-[#0F172A]">
        We couldn't find that page.
      </h1>
      <p className="mt-3 font-sans text-[18px] text-[#0F172A]/75">
        The link may be old or mistyped. The recipes are all still here, safe
        and sound.
      </p>
      <Button
        asChild
        className="mt-6 h-12 bg-[#0F172A] px-8 font-ui text-[17px] font-medium text-white hover:bg-[#2596be]"
      >
        <Link to="/">Back to Browse</Link>
      </Button>
    </div>
  );
}
