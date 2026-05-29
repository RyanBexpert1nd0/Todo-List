"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Echo from "laravel-echo"
import Pusher from "pusher-js"

export function useEcho() {
  const { getToken } = useAuth()
  const [echoInstance, setEchoInstance] = useState<Echo | null>(null)

  useEffect(() => {
    let instance: Echo | null = null

    const initEcho = async () => {
      // In a real scenario, Pusher is attached to window
      window.Pusher = Pusher

      const token = await getToken()

      instance = new Echo({
        broadcaster: "reverb",
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname,
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "https") === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })

      setEchoInstance(instance)
    }

    initEcho()

    return () => {
      if (instance) {
        instance.disconnect()
      }
    }
  }, [getToken])

  return echoInstance
}
