"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RelayContext } from "./relay-provider";

export const ProfilesContext = createContext([]);

export default function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState({});
  const [pubkeys, setpubkeys] = useState([]);
  const [reload, setReload] = useState(false);
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  // TODO: set entire profile not just content
  useEffect(() => {
    if (activeRelay) {
      let relayUrl = activeRelay.url.replace("wss://", "");
      let sub = activeRelay.sub([
        {
          kinds: [0],
          authors: pubkeys,
        },
      ]);
      let events = [];
      sub.on("event", (event) => {
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
      });
      sub.on("eose", () => {
        if (events.length !== 0) {
          // console.log("WE HAVE PROFILES:", events);
          events.forEach((event) => {
            let profileKey = `profile_${relayUrl}_${event.pubkey}`;
            // const contentObj = JSON.parse(event.content);
            profiles[profileKey] = event;
            // setProfiles([...profiles]);
            const newProfiles = profiles
            setProfiles(newProfiles);
          });
        }
        sub.unsub();
      });
    }
  }, [pubkeys]);

  return (
    <ProfilesContext.Provider
      value={{ profiles, setProfiles, pubkeys, setpubkeys, reload, setReload }}
    >
      {children}
    </ProfilesContext.Provider>
  );
}