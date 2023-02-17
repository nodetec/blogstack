"use client";

import { SlNote } from "react-icons/sl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogContext } from "./context/blog-provider";
import { useContext, useState } from "react";
import { RelayContext } from "./context/relay-provider";
import { useRouter } from "next/navigation";
import { NostrService } from "./lib/nostr";
import { KeysContext } from "./context/keys-provider.jsx";
import { nip19 } from "nostr-tools";
import Button from "./Button";
import Popup from "./Popup";
import CreatableSelect from "react-select/creatable";

const WriteButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tagsList, setTagsList] = useState<{ label: string; value: string }[]>(
    []
  );

  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const publicKey = keys?.publicKey;
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  const setNoOptionsMessage = () => {
    return "No Options";
  };

  const handleSetTagsList = (list: any) => {
    if (list.length > 5) {
      return;
    }
    setTagsList(list);
  };

  const validateBlog = () => {
    const validations = { title: true, body: true };

    if (blog.title.trim().length)  {
      validations.title = true;
    } else {
      validations.title = false;
    }

    if (blog.body.trim().length)  {
      validations.body = true;
    } else {
      validations.body = false;
    }

    return validations;
  };

  const handlePublish = async () => {
    const validations = validateBlog();

    setBlog({ ...blog, titleValid: validations.title, bodyValid: validations.body });
    if (validations.title && validations.body) {
      setIsOpen(true);
    }
  };

  const submitPublish = async () => {
    const { title, text } = blog;

    const tags = [
      ["client", "blogstack.io"],
      ["subject", title],
    ];

    for (let tagValue of tagsList) {
      tags.push(["t", tagValue.value]);
    }

    let event = NostrService.createEvent(2222, publicKey, text, tags);

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    let eventId: any = null;
    eventId = event?.id;

    if (!activeRelay) {
      // console.log("relay not active!");
      return;
      // TODO: handle this
    }
    let pub = activeRelay.publish(event);
    pub.on("ok", () => {
      // console.log(`DELETE EVENT WAS ACCEPTED by ${activeRelay.url}`);
    });
    pub.on("seen", () => {
      // console.log(`DELETE EVENT WAS SEEN ON ${activeRelay.url}`);
      router.push("/u/" + nip19.npubEncode(publicKey));
    });
    pub.on("failed", (reason: string) => {
      // console.log(
      //   `OUR DELETE EVENT HAS FAILED WITH REASON: ${activeRelay.url}: ${reason}`
      // );
    });
  };

  return (
    <>
      {pathname === "/write" ? (
        <>
          <Button size="sm" color="green" onClick={handlePublish}>
            Publish
          </Button>
          <Popup title="Add Tags" isOpen={isOpen} setIsOpen={setIsOpen}>
            <small>Add topics (up to 5)</small>
            <CreatableSelect
              isMulti
              noOptionsMessage={setNoOptionsMessage}
              value={tagsList}
              isOptionDisabled={() => tagsList.length >= 5}
              options={[]}
              onChange={handleSetTagsList}
            />
            ;
            <Button size="sm" color="green" onClick={submitPublish}>
              Publish Now
            </Button>
          </Popup>
        </>
      ) : (
        <Link
          className="flex gap-2 text-gray hover:text-gray-hover"
          href="/write"
        >
          <SlNote size="20" />
          <span className="text-sm">Write</span>
        </Link>
      )}
    </>
  );
};

export default WriteButton;
