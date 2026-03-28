import { FullPageLoader } from "@/components/loading/full-page-loader";

export default function MemberLoading() {
  return <FullPageLoader messages={["Loading today's fixtures", "Getting the game ready for you"]} />;
}
