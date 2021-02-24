export async function getCirculation(): Promise<{
  success: boolean
  data?: { usdPrice: number; circulatingSupply: string; totalSupply: number }
}> {
  try {
    const response = await fetch(`https://api.vaiot.ai/token`)
    if (!response.ok) {
      return { success: false }
    } else {
      const json = await response.json()
      return { success: true, data: json }
    }
  } catch (error) {
    console.log(error)
    return { success: false }
  }
}
