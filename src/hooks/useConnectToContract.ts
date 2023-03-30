import { useMemo } from 'react'
import { ethers } from 'ethers'

import VAI_STAKING_REWARD_ABI from '../constants/abis/vaiot/VaiStakingContract.json'

const ETH_NETWORK_URL = process.env.REACT_APP_ETH_NETWORK_URL ?? ''
const POLYGON_NETWORK_URL = process.env.REACT_APP_POLYGON_NETWORK_URL ?? ''
const WALLET_KEY = process.env.REACT_APP_WALLET_KEY ?? ''

function getContract(address: string, networkUrl: string, abi: any) {
  const provider = new (ethers.getDefaultProvider as any)(networkUrl)
  const wallet = new ethers.Wallet(WALLET_KEY, provider)
  const contract = new ethers.Contract(address, abi, wallet)

  return contract
}

export function useConnectToVaiStakingContract(address: string) {
  return useMemo(() => {
    return getContract(address, POLYGON_NETWORK_URL, VAI_STAKING_REWARD_ABI.abi)
  }, [address])
}

export function useConnectToEthContract(address: string, abi: any) {
  return useMemo(() => {
    return getContract(address, ETH_NETWORK_URL, abi)
  }, [address, abi])
}
