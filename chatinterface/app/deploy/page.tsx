import { redirect } from 'next/navigation';

/* Legacy standalone route. This URL used to render the Deploy screen on its own,
   outside the console shell — no sidebar, no header, no chatbot in scope — so it
   could only ever show the empty state. The console owns that screen now and
   keeps its place in the query string, so this route exists purely to forward
   old links and bookmarks instead of 404ing them. */
export default function Page() {
  redirect('/dashboard?p=deploy');
}
