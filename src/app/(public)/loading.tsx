import { FullPageLoader } from "@/components/loading/full-page-loader";

export default function PublicLoading() {
  return <FullPageLoader messages={["Getting things ready for you", "Opening the game room"]} />;
}
