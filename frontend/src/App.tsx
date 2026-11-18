import AppRoutes from "./routes/AppRoutes";
import CatalogBoundary from "./shared/components/CatalogBoundary";
import { useLocation } from "react-router-dom";
import AIRecommendationPage from "./registration/pages/AIRecommendationPage";

function AppContent() {
  const location = useLocation();
  if (location.pathname === "/ai-test") return <AIRecommendationPage demoMode />;
  return <CatalogBoundary><AppRoutes /></CatalogBoundary>;
}

export default function App() {
  return <AppContent />;
}
