import axios from 'axios'

export async function getCirculation() {
  try {
    const response = await axios.post<{
      price: Record<
        string,
        {
          name: string
          circulating_supply: number
          quote: {
            USD: {
              price: number
            }
          }
        }[]
      >
    }>('https://baseapi.vaiot.ai/api/v1/asset/getAssetPrice', {
      symbol: 'VAI',
      version: 'v2'
    })

    const vaiObj = response?.data?.price['VAI'].find(el => el.name === 'VAIOT')

    return {
      success: true,
      data: {
        price: vaiObj?.quote?.USD?.price,
        circulation: vaiObj?.circulating_supply
      }
    }
  } catch (error) {
    console.log(error)
    return { success: false }
  }
}
