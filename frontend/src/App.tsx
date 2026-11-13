import AppRoutes from "./routes/AppRoutes";
import CatalogBoundary from "./shared/components/CatalogBoundary";

export default function App() {
  return <CatalogBoundary><AppRoutes /></CatalogBoundary>;
}
