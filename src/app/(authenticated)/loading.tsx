import { FullPageLoader } from "@/components/loading/full-page-loader";

export default function AuthenticatedLoading() {
  return <FullPageLoader messages={["Getting things ready for you", "Checking your game access"]} />;
}
