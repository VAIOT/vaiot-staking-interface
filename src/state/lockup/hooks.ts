import { ChainId, JSBI, Token, TokenAmount } from '@uniswap/sdk'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { LOCKUP_INTERFACE } from '../../constants/abis/staking-rewards'

export const LOCKUP_INFO: {
  [chainId in ChainId]?: {
    token: Token
    lockupAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      token: VAI[ChainId.MAINNET],
      lockupAddress: '0xCc8cB12A87506c767dFe4d3Df37FE43Bcb711cEa'
    }
  ],
  [ChainId.ROPSTEN]: [
    {
      token: VAI[ChainId.ROPSTEN],
      lockupAddress: '0xCc8cB12A87506c767dFe4d3Df37FE43Bcb711cEa'
    }
  ]
}

export interface LockupInfo {
  lockupAddress: string
  token: Token
  currentAmount: TokenAmount
}

export function useLockupInfo(): LockupInfo[] {
  const { chainId, account } = useActiveWeb3React()
  const info = useMemo(() => (chainId ? LOCKUP_INFO[chainId] ?? [] : []), [chainId])
  const vai = chainId ? VAI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ lockupAddress }) => lockupAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  const balances = useMultipleContractSingleData(
    rewardsAddresses,
    LOCKUP_INTERFACE,
    'beneficiaryCurrentAmount',
    accountArg
  )

  return useMemo(() => {
    if (!chainId || !vai) return []

    return rewardsAddresses.reduce<LockupInfo[]>((memo, rewardsAddress, index) => {
      const balanceState = balances[index]
      if (
        // these may be undefined if not logged in
        !balanceState?.loading
      ) {
        if (balanceState?.error) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        memo.push({
          lockupAddress: rewardsAddress,
          token: info[index].token,
          currentAmount: new TokenAmount(vai, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        })
      }
      return memo
    }, [])
  }, [balances, chainId, info, rewardsAddresses, vai])
}
