import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  chrome.windows.create(
    {
      focused: true,
      width: 400,
      height: 600,
      type: "popup",
      url: `popup.html#${req.body.host}`,
      top: 0,
      left: 0
    },
    () => {}
  )
}

export default handler
