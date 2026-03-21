// App.jsx
// Root component. Handles client-side routing between the three views:
//
//   /host         → HostPage       (laptop, AV volunteer)
//   /projection   → ProjectionPage (big screen at front of church)
//   /join?session=XXXX → AttendeePage  (attendee's phone after QR scan)
//
// Uses simple pathname-based routing so there's no router dependency —
// swap this for React Router's <Routes> if you add more pages later.

import "./styles/global.css";
import HostPage       from "./pages/HostPage";
import ProjectionPage from "./pages/ProjectionPage";
import AttendeePage   from "./pages/AttendeePage";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/host";

  if (path === "/projection") return <ProjectionPage />;
  if (path === "/join")       return <AttendeePage />;

  // Default: host dashboard (also catches /host)
  return <HostPage />;
}
