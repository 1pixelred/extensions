import { Badge, Box, Button, Center, Grid, Notification } from "@mantine/core"
import * as fcl from "@onflow/fcl"
import {
  IconLogout,
  IconSquareRotatedFilled,
  IconUser
} from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { ThemeProvider } from "~theme"

fcl.config({
  "flow.network": "testnet",
  "accessNode.api": "https://rest-testnet.onflow.org", // Mainnet: "https://rest-mainnet.onflow.org"
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Mainnet: "https://fcl-discovery.onflow.org/authn"
  "app.detail.icon": "https://1pixel.red/android-icon-192x192.png",
  "app.detail.title": "1PIXEL.🟥",
  "0xPixel": "0x60fb6829e09510da"
})

function IndexPopup() {
  const [user, setUser]: any = useStorage("user", (v: any) =>
    v === undefined ? { loggedIn: null } : v
  )
  const [NFTs, setNFTs]: any = useStorage("NFTs", (v: any) =>
    v === undefined ? [] : v
  )
  const [domains, setDomains]: any = useStorage("domains", (v: any) =>
    v === undefined ? [] : v
  )

  const { hash } = window.location
  const [domain, setDomain] = useState("")

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  useEffect(() => {
    if (user) myDomains()
  }, [user])

  useEffect(() => {
    if (hash) setDomain(hash.replace("#", ""))
  }, [hash])

  const contract = "Pixel"

  const myDomains = async () => {
    const getDomains = await fcl.query({
      cadence: `
          import ${contract} from 0xPixel
          pub fun main(): [String] {
            return ${contract}.getDomains()
          }
        `
    })
    setDomains(getDomains)

    if (user && user.addr) {
      const myDomains = await fcl.query({
        cadence: `
            import ${contract} from 0xPixel
            pub fun main(_ address: Address): [String] {
                let nftOwner = getAccount(address)
                let receiverRef = nftOwner.getCapability<&{${contract}.IPortfolio}>(${contract}.PortfolioPublicPath)
                  .borrow()
                  ?? panic("Could not borrow receiver reference")
                return receiverRef.getDomains()
            }
          `,
        args: (arg: any, t: any) => [arg(user?.addr, t.Address)]
      })
      setNFTs(myDomains.sort().reverse())
    }
  }

  const winDomain = async () => {
    if (!domain) return
    await fcl.mutate({
      cadence: `
          import ${contract} from 0xPixel
          transaction(_ domain: String) {
            let receiverRef: &{${contract}.IPortfolio}
            prepare(account: AuthAccount) {
              self.receiverRef = account.getCapability<&{${contract}.IPortfolio}>(${contract}.PortfolioPublicPath)
                .borrow()
                ?? panic("Could not borrow receiver reference")
            }
            execute {
              let d <- ${contract}.winDomain(domain)!
              self.receiverRef.insert(<-d)
            }
          }
        `,
      args: (arg: any, t: any) => [arg(domain, t.String)]
    })
    window.close()
  }

  const UnauthenticatedState = () => {
    return (
      <Center
        style={{
          width: 400,
          height: 600,
          backgroundImage: `url(./assets/bg.png)`
        }}>
        <Grid grow>
          <Grid.Col span={12}>
            <Button
              fullWidth
              variant="light"
              color="red"
              size="xl"
              onClick={fcl.logIn}>
              Log In
            </Button>
          </Grid.Col>
          <Grid.Col span={12}>
            <Button
              fullWidth
              variant="light"
              color="red"
              size="xl"
              onClick={fcl.signUp}>
              Sign Up
            </Button>
          </Grid.Col>
        </Grid>
      </Center>
    )
  }

  const AuthedState = () => {
    return (
      <Box>
        <Grid
          style={{
            height: "60px",
            position: "fixed",
            top: "0",
            right: "0",
            width: "410px",
            zIndex: "1",
            background: "#1A1B1E"
          }}>
          <Grid.Col span={6}>
            <Center style={{ height: 40 }}>
              <Badge
                variant="gradient"
                sx={{ paddingLeft: 3 }}
                leftSection={<IconUser size={28} />}
                ml={20}
                mt={10}>
                {user?.addr ?? "No Address"}
              </Badge>
            </Center>
          </Grid.Col>
          <Grid.Col span={6} style={{ textAlign: "right" }}>
            {user?.addr && (
              <Button
                mt={5}
                style={{ height: 40, background: "none" }}
                onClick={fcl.unauthenticate}
                variant="subtle"
                color="gray">
                <IconLogout />
              </Button>
            )}
          </Grid.Col>
        </Grid>
        <Center
          style={{
            marginTop: 65,
            minWidth: 400,
            minHeight: 500
          }}>
          <Grid grow w="90%">
            {NFTs && NFTs.length ? (
              NFTs.map((nft: any, i: any) => {
                return (
                  <Grid.Col
                    key={i}
                    span={12}
                    px={40}
                    py={100}
                    mb={10}
                    style={{
                      fontWeight: "bold",
                      fontSize: "35px",
                      borderRadius: "20px",
                      background: "linear-gradient(to right, #4A00E0, #8E2DE1)",
                      position: "relative",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      opacity: ".95",
                      color: "#fff"
                    }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "0",
                        top: "0",
                        fontSize: "300px",
                        opacity: ".1"
                      }}>
                      {nft.split(" ")[0]}
                    </span>
                    {nft.split(" ")[1]}
                  </Grid.Col>
                )
              })
            ) : (
              <Center>
                <Grid>
                  <Grid.Col span={12}>
                    <Notification
                      disallowClose
                      icon={<IconSquareRotatedFilled size={18} />}
                      color="red"
                      sx={{ padding: "20px" }}>
                      Go in search of the red pixel and it will show up here.
                    </Notification>
                  </Grid.Col>
                </Grid>
              </Center>
            )}
          </Grid>
        </Center>
      </Box>
    )
  }

  const MintDomain = () => {
    return (
      <Center
        style={{
          minWidth: "400px",
          minHeight: "550px",
          padding: 0,
          margin: 0
        }}>
        <Grid grow>
          <Grid.Col span={12}>
            <Button
              fullWidth
              variant="light"
              color="red"
              size="xl"
              onClick={winDomain}>
              Mint NFT Pixel
            </Button>
          </Grid.Col>
        </Grid>
      </Center>
    )
  }

  return (
    <ThemeProvider>
      <div
        style={{
          minWidth: "400px",
          minHeight: "550px",
          backgroundImage: `url(./assets/bg.png)`,
          padding: 0,
          margin: 0
        }}>
        {user.loggedIn ? (
          domain ? (
            <MintDomain />
          ) : (
            <AuthedState />
          )
        ) : (
          <UnauthenticatedState />
        )}
      </div>
    </ThemeProvider>
  )
}

export default IndexPopup
