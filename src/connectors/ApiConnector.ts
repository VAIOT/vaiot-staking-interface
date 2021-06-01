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

export async function getEarned(
  address: any
): Promise<{
  success: boolean
  data?: { earned: number }
}> {
  try {
    const response = await fetch(`https://private-staking-api.vaiot.ai/earned?` + address)
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

export async function getTotal(
  address: any
): Promise<{
  success: boolean
  data?: { total: number }
}> {
  try {
    const response = await fetch(`https://private-staking-api.vaiot.ai/total?` + address)
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
