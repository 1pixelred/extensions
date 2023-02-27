import { Buffer } from "buffer"
import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"
import { SHA3 } from "sha3"

import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = () => document.body

const PlasmoOverlay = () => {
  const [domains]: any = useStorage("domains")

  const hash = new SHA3(256)
  const host = window.location.host.replace("#", "")

  const newBuffer = (input: any, encoding: any) => {
    try {
      return Buffer.from(input, encoding)
    } catch (error) {
      return new Buffer(input, encoding)
    }
  }

  if (
    domains &&
    domains.indexOf(
      hash.reset().update(newBuffer(host, "utf8")).digest("hex")
    ) + 1
  ) {
    const randomLeft =
      Math.floor(Math.random() * (window.screen.availHeight - 10 - 10 + 1)) + 10
    const randomRight =
      Math.floor(Math.random() * (window.screen.availWidth - 10 + 1)) + 10
    console.log(randomLeft, randomRight)
    return (
      <span
        style={{
          position: "fixed",
          left: randomLeft + "px",
          top: randomRight + "px",
          width: "3px",
          height: "3px",
          backgroundColor: "#f00",
          cursor: "pointer"
        }}
        onClick={async (e) => {
          sendToBackground({
            name: "pixel",
            body: {
              host: host
            }
          })
          e.currentTarget.style.backgroundColor = ""
        }}></span>
    )
  }
}

export default PlasmoOverlay
