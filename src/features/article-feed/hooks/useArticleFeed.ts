import {
  useInfiniteQuery,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { type RelayMetadata } from "~/lib/events/relay-metadata-event";
import { getArticles, getTag } from "~/lib/nostr";
import { useAppState } from "~/store";
import { useSearchParams } from "next/navigation";
import type { Event } from "nostr-tools";
import { toast } from "sonner";

const fetchArticles = async ({
  pageParam = 0,
  queryKey,
}: QueryFunctionContext) => {
  const page = (pageParam as number) || 0;
  const relays = queryKey[1] as string[];
  const publicKey = queryKey[2] as string;
  const followEvent = queryKey[3] as Event;
  const feed = queryKey[4] as string;
  const response = await getArticles(
    relays,
    page,
    publicKey,
    followEvent,
    feed,
  );

  const addArticle = useAppState.getState().addArticle;

  if (response.articles.length === 0) {
    toast("You've reached the end", {
      description: "No more articles found",
    });
  }

  response.articles.forEach((article) => {
    const identifier = getTag("d", article.tags);
    const publicKey = article.pubkey;
    const id = identifier + publicKey;
    addArticle(id, article);
  });

  return response;
};

export const useArticleFeed = (
  profilePublicKey: string | undefined,
  userFollowEvent: Event | null | undefined,
  profileRelayMetadata: RelayMetadata | null | undefined,
) => {
  const searchParams = useSearchParams();
  console.log(
    "useArticleFeed",
    profilePublicKey,
    userFollowEvent,
    profileRelayMetadata,
  );
  const relays = profileRelayMetadata?.writeRelays ?? DEFAULT_RELAYS;

  return useInfiniteQuery({
    queryKey: [
      "articles",
      relays,
      profilePublicKey,
      userFollowEvent,
      searchParams.get("feed"),
    ],
    queryFn: fetchArticles,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: Infinity,
    staleTime: Infinity,
    initialPageParam: 0,
    enabled:
      userFollowEvent !== undefined && profileRelayMetadata !== undefined, // Ensure the query only runs if userFollowEvent is defined
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
