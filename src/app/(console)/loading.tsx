/* Console loading state — shown while a console page's data streams in.
   Paper-toned skeleton in the registry layout rhythm (kicker, serif title,
   card blocks) so navigation never flashes a blank or stock spinner. */
export default function ConsoleLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-3 w-44 rounded bg-paper-deep" />
      <div className="mt-3 h-9 w-72 max-w-full rounded bg-paper-deep" />
      <div className="mt-3 h-4 w-[34rem] max-w-full rounded bg-paper-deep" />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="h-28 rounded-lg border border-hairline bg-paper-panel" />
        <div className="h-28 rounded-lg border border-hairline bg-paper-panel" />
        <div className="h-28 rounded-lg border border-hairline bg-paper-panel" />
      </div>
      <div className="mt-5 h-64 rounded-lg border border-hairline bg-paper-panel" />
    </div>
  );
}
