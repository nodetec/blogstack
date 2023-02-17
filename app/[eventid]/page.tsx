"use client";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import Blog from "./Blog";
import { RelayContext } from "../context/relay-provider";
import { CachedEventContext } from "../context/cached-event-provider";
import { ProfilesContext } from "../context/profiles-provider";

export default function NotePage() {
  const pathname = usePathname();
  let eventId: string = "";
  if (pathname && pathname.length > 60) {
    eventId = pathname.split("/").pop() || "";
    eventId = nip19.decode(eventId).data.toString();
  }

  const { relayUrl, activeRelay, subscribe } = useContext(RelayContext);
  const [event, setEvent] = useState<Event>();
  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  // @ts-ignore
  const { cachedEvent, setCachedEvent } = useContext(CachedEventContext);

  const getEvents = async () => {
    let pubkeysSet = new Set<string>();

    setEvent(undefined);
    let relayName = relayUrl.replace("wss://", "");

    const filter = {
      ids: [eventId],
      kinds: [30023],
    };

    let events: Event[] = [];

    const onEvent = (event: any) => {
      // @ts-ignore
      event.relayName = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    };

    const onEOSE = () => {
      if (events.length > 0) {
        setEvent(events[0]);
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
    };

    subscribe([relayUrl], filter, onEvent, onEOSE);
  };

  // todo cache
  useEffect(() => {
    if (cachedEvent) {
      // console.log("Using cached event", cachedEvent);
      setEvent(cachedEvent);
      setCachedEvent(undefined);
      return;
    }
    getEvents();
  }, []);

  if (event) {
    return <Blog event={event} />;
  }
}
