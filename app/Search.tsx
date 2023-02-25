"use client";
import {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
  useContext,
  useEffect,
  useState,
} from "react";
import Tooltip from "./Tooltip";
import { nip19 } from "nostr-tools";
import Link from "next/link";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { shortenHash } from "./lib/utils";
import { RelayContext } from "./context/relay-provider";
import { ProfilesContext } from "./context/profiles-provider";
import { Search as SearchIcon, Tag as TagIcon } from "@/app/icons";

type ResultType = {
  pubkeys: string[];
  tags: string[];
};

const Search = () => {
  const { relayUrl, activeRelay, subscribe } = useContext(RelayContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [{ tags, pubkeys }, setResults] = useState<ResultType>({
    tags: [],
    pubkeys: [],
  });

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const handleToggle = () => {
    if (tags.length === 0 && pubkeys.length === 0) return;
    setShowTooltip((current) => !current);
  };

  function getTValues(tags: string[][]) {
    return tags
      .filter((subTags) => subTags[0] === "t")
      .map((subTags) => subTags[1])
      .filter((t) => t.length <= 20);
  }

  // TODO: change filter check if begins with npub, note otherwise just search tags
  // TODO: add title and link to article as well
  // TODO: cache searches
  const getSearchEvents = async () => {
    if (searchTerm.length === 0) {
      setResults({ tags: [], pubkeys: [] });
      setShowTooltip(false);
      return;
    }
    if (!activeRelay) {
      setResults({ tags: [], pubkeys: [] });
      setShowTooltip(false);
      return;
    }

    let searchTagsSet = new Set<string>();
    let pubkeysSet = new Set<string>();

    const filter = {
      kinds: [30023],
      "#t": [searchTerm],
    };

    const onEvent = (event: any) => {
      const tValues = getTValues(event.tags);
      tValues.forEach((t) => searchTagsSet.add(t));
      pubkeysSet.add(event.pubkey);
    };

    const onEOSE = () => {
      const searchTags = Array.from(searchTagsSet).slice(0, 3);
      const searchPubkeys = Array.from(pubkeysSet).slice(0, 3);
      setResults((current: ResultType) => {
        return {
          ...current,
          pubkeys: searchPubkeys,
          tags: searchTags,
        };
      });
      if (searchTags.length > 0 || searchPubkeys.length > 0) {
        setShowTooltip(true);
      } else {
        setShowTooltip(false);
      }
    };

    subscribe([relayUrl], filter, onEvent, onEOSE);
  };

  // TODO: fix this
  useEffect(() => {
    getSearchEvents();
  }, [searchTerm, relayUrl, activeRelay]);

  return (
    <Tooltip
      show={showTooltip}
      toggle={() => handleToggle()}
      direction="bottom"
      Component={<SearchInput value={searchTerm} onChange={handleChange} />}
    >
      <div className="w-[20rem]">
        {pubkeys.length > 0 ? (
          <SearchGroup title="People">
            {pubkeys.map((pubkey: string, index: number) => (
              <Link
                key={index}
                href={"/u/" + nip19.npubEncode(pubkey)}
                onClick={() => handleToggle()}
                className="flex items-center gap-2 py-2"
              >
                <Profile key={pubkey} pubkey={pubkey} />
              </Link>
            ))}
          </SearchGroup>
        ) : null}
        {tags.length > 0 ? (
          <SearchGroup title="Tags">
            {tags.map((tag: string, index: number) => (
              <Link
                key={index}
                className="flex items-center gap-4 text-gray-hover pt-2"
                onClick={() => handleToggle()}
                href={`/tag/${tag}`}
              >
                <Tag key={tag} tag={tag} />
              </Link>
            ))}
          </SearchGroup>
        ) : null}
      </div>
    </Tooltip>
  );
};

const SearchInput: FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
> = (props) => (
  <div className="flex flex-row items-center gap-2 px-3 py-2 bg-light-gray bg-opacity-40 rounded-full">
    <SearchIcon className="text-gray-hover" size="15" />
    <input
      placeholder="Search blogstack"
      className="bg-transparent focus:outline-none focus:ring-0"
      type="text"
      {...props}
    />
  </div>
);

interface SearchGroupProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  title: string;
}

const SearchGroup: FC<SearchGroupProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col gap-2 py-4 px-2">
      <h3 className="text-gray pb-2 border-b border-b-light-gray text-sm">
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
};

// TODO: profile

const Profile: FC<{ pubkey: string }> = ({ pubkey }) => {
  const npub = nip19.npubEncode(pubkey);
  const { relayUrl, activeRelay } = useContext(RelayContext);
  // @ts-ignore
  const { profiles, addProfiles, reload } = useContext(ProfilesContext);

  const [name, setName] = useState<string>("");
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));

  const getProfile = () => {
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${pubkey}`;

    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([pubkey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setName(profileContent.name);
      if (!profileContent.picture || profileContent.picture === "") {
        setPicture(DUMMY_PROFILE_API(npub));
      } else {
        setPicture(profileContent.picture);
      }
    }
  };

  useEffect(() => {
    getProfile();
  }, [reload, relayUrl, activeRelay]);

  return (
    <>
      <img
        className="w-5 h-5 bg-light-gray rounded-full object-cover"
        src={picture}
        alt=""
      />
      <span>{name || shortenHash(npub)}</span>
    </>
  );
};

const Tag: FC<{ tag: string }> = ({ tag }) => {
  return (
    <>
      <TagIcon size="20" className="text-gray" />
      <span>{tag}</span>
    </>
  );
};

export default Search;
