"use client";
import { useContext, useEffect, useState } from "react";
import { BsLightningChargeFill } from "react-icons/bs";
import Popup from "./Popup";

import Button from "./Button";
import AccountButton from "./AccountButton";

import { KeysContext } from "./context/keys-provider.jsx";

export default function Login() {
  // @ts-ignore
  const { keys, setKeys } = useContext(KeysContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isLightningConnected, setIsLightningConnected] = useState(false);

  useEffect(() => {
    const shouldReconnect = localStorage.getItem("shouldReconnect");

    const getConnected = async (shouldReconnect: string) => {
      let enabled = false;

      // @ts-ignore
      if (typeof window.nostr === "undefined") {
        return;
      }

      if (shouldReconnect === "true") {
        // @ts-ignore
        const publicKey = await nostr.getPublicKey();
        // console.log("public key", publicKey);
        setKeys({ privateKey: "", publicKey: publicKey });
      }

      // @ts-ignore
      if (typeof window.webln === "undefined") {
        return;
      }

      // @ts-ignore
      if (shouldReconnect === "true" && !webln.executing) {
        try {
          // @ts-ignore
          enabled = await window.webln.enable();
          setIsLightningConnected(true);
        } catch (e: any) {
          console.log(e.message);
        }
      }
      return enabled;
    };

    if (shouldReconnect === "true") {
      getConnected(shouldReconnect);
    }
  }, [setKeys]);

  const loginHandler = async () => {
    // @ts-ignore
    if (typeof window.nostr !== "undefined") {
      // @ts-ignore
      const publicKey = await nostr.getPublicKey();
      // console.log("public key", publicKey);
      setKeys({ privateKey: "", publicKey: publicKey });
      localStorage.setItem("shouldReconnect", "true");
    }

    // @ts-ignore
    if (typeof window.webln !== "undefined") {
      // @ts-ignore
      await window.webln.enable();
    }
    console.log("connected ");
    setIsLightningConnected(true);
    setIsOpen(false);
  };

  const handleClick = async () => {
    setIsOpen(true);
  };

  return (
    <>
      {isLightningConnected && keys?.publicKey ? (
        <AccountButton pubkey={keys?.publicKey} />
      ) : (
        <Button variant="outline" onClick={handleClick} size="sm">
          login
        </Button>
      )}

      <Popup title="Generate Keys" isOpen={isOpen} setIsOpen={setIsOpen}>
        <Button
          className="w-full"
          onClick={loginHandler}
          size="sm"
        >
          {isLightningConnected ? "connected" : "Login with Extension"}
        </Button>
      </Popup>
    </>
  );
}
