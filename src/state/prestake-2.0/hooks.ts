import { ChainId, JSBI, Pair, Token, TokenAmount } from '@uniswap/sdk'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMemo } from 'react'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { PRE_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'

export const PRE_STAKING_2_REWARDS_INFO: {
  [chainId in ChainId]?: {
    token: Token
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      token: VAI[ChainId.MAINNET],
      stakingRewardAddress: '0x2A68Ced186E48Ff1f2230ae749dB73a5Fd35eC13'
    }
  ],
  [ChainId.ROPSTEN]: [
    {
      token: VAI[ChainId.ROPSTEN],
      stakingRewardAddress: '0x2353C75160F6dA5d006398bee01074986C03D16d'
    }
  ]
}

export interface PreStaking2Info {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  token: Token
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  currentStakingLimit: TokenAmount
  // the percentage of token
  totalRewardRate: JSBI
}

export function usePreStaking2Info(pairToFilterBy?: Pair | null): PreStaking2Info[] {
  const { chainId, account } = useActiveWeb3React()
  const info = useMemo(
    () =>
      chainId
        ? PRE_STAKING_2_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.token)
          ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )
  const vai = chainId ? VAI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])
  const balances = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'balanceOf',
    accountArg
  )
  const totalSupplies = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'currentTotalStake'
  )

  // ToDo reward rate as constant

  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )

  const earnedAmounts = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'earned',
    accountArg
  )

  return useMemo(() => {
    if (!chainId || !vai) return []

    return rewardsAddresses.reduce<PreStaking2Info[]>((memo, rewardsAddress, index) => {
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      // const stakingLimitState = stakingLimit[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading
      ) {
        if (
          balanceState?.error ||
          // earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }
        const token = info[index].token
        const totalStakedAmount = new TokenAmount(token, totalSupplyState.result?.[0] ?? 0)
        const totalRewardRate = JSBI.BigInt(rewardRateState.result?.[0] ?? 0)
        const stakingLimit = new TokenAmount(token, JSBI.BigInt(10000000 * 1000000000000000000))
        const earned = new TokenAmount(token, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0))

        memo.push({
          stakingRewardAddress: rewardsAddress,
          token: info[index].token,
          earnedAmount: earned,
          totalRewardRate: totalRewardRate,
          stakedAmount: new TokenAmount(vai, JSBI.BigInt(balanceState?.result?.[0] ?? 0)),
          totalStakedAmount: totalStakedAmount,
          currentStakingLimit: stakingLimit
        })
      }
      return memo
    }, [])
  }, [balances, chainId, earnedAmounts, info, rewardsAddresses, totalSupplies, vai, rewardRates])
}
