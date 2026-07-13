// Friendly full-width notice for when the recipe list fails to load,
// instead of leaving the loading skeletons up forever.
export default function LoadErrorNotice() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="font-heading text-xl font-bold text-primary">
        The recipes couldn't load.
      </p>
      <p className="mt-2 font-sans text-[18px] text-primary/75">
        Please check your internet connection, then refresh this page.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 inline-flex h-11 items-center rounded-[6px] bg-primary px-6 font-ui text-[16px] font-medium text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Refresh
      </button>
    </div>
  );
}
