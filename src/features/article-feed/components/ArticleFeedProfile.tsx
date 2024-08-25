import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getProfile, shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import { type Profile } from "~/types";
import { EllipsisVerticalIcon } from "lucide-react";
import Image from "next/image";

type Props = {
  relays: string[];
  publicKey: string;
};

export default function ArticleFeedProfile({ relays, publicKey }: Props) {
  const { data: profile, status } = useQuery<Profile>({
    queryKey: ["profile", publicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () => getProfile(relays ?? DEFAULT_RELAYS, publicKey),
  });

  if (status === "pending") {
    return (
      <div className="sticky top-0 mb-2 w-full bg-secondary/95 pt-7 backdrop-blur transition-colors duration-500">
        <div className="flex items-center justify-between px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4">
            <Skeleton className="aspect-square w-10 overflow-hidden rounded-full object-cover" />
            <Skeleton className="h-8 w-36" />
          </div>

          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>

        <div className="w-full px-4 md:px-6">
          <Separator />
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="sticky top-0 mb-2 w-full bg-secondary/95 pt-7 backdrop-blur transition-colors duration-500">
        <div className="flex items-center justify-between px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4">
            <Image
              className="aspect-square w-10 overflow-hidden rounded-full object-cover hover:brightness-90"
              src={profile?.picture ?? getAvatar(publicKey)}
              width={48}
              height={48}
              alt=""
            />
            <h2 className="text-2xl font-semibold text-foreground/80">
              {profile?.name ?? shortNpub(publicKey)}
            </h2>
          </div>

          {/* <ArticleFeedFilterDropdown> */}
          <Button
            className="bg-accent text-foreground/80 hover:bg-foreground/20"
            variant="secondary"
            size="icon"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {/* </ArticleFeedFilterDropdown> */}
        </div>
        <div className="w-full px-4 md:px-6">
          <Separator />
        </div>
      </div>
    );
  }
}