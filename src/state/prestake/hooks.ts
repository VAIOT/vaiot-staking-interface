import { ChainId, JSBI, Pair, Token, TokenAmount } from '@uniswap/sdk'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMemo } from 'react'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { PRE_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'

export const PRE_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    token: Token
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      token: VAI[ChainId.MAINNET],
      stakingRewardAddress: '0xa635D5b9e72169d8164b837Eb864bb74365A9B8D'
    }
  ],
  [ChainId.ROPSTEN]: [
    {
      token: VAI[ChainId.ROPSTEN],
      stakingRewardAddress: '0x2353C75160F6dA5d006398bee01074986C03D16d'
    }
  ]
}

export interface PreStakingInfo {
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
  isLockup: boolean
}

export function usePreStakingInfo(pairToFilterBy?: Pair | null): PreStakingInfo[] {
  const { chainId, account } = useActiveWeb3React()
  const info = useMemo(
    () =>
      chainId
        ? PRE_STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
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
  const stakingLimit = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'currentStakingLimit'
  )

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

  const isLockups = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'isLockup',
    accountArg
  )

  return useMemo(() => {
    if (!chainId || !vai) return []

    return rewardsAddresses.reduce<PreStakingInfo[]>((memo, rewardsAddress, index) => {
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const stakingLimitState = stakingLimit[index]
      const isLockupState = isLockups[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        stakingLimitState &&
        !stakingLimitState.loading &&
        !isLockupState?.loading
      ) {
        if (
          balanceState?.error ||
          // earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          stakingLimitState.error ||
          // timeUntilWithdrawalState.error
          isLockupState?.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }
        const token = info[index].token
        const totalStakedAmount = new TokenAmount(token, totalSupplyState.result?.[0] ?? 0)
        const totalRewardRate = JSBI.BigInt(rewardRateState.result?.[0] ?? 0)
        const stakingLimit = new TokenAmount(token, JSBI.BigInt(stakingLimitState.result?.[0] ?? 0))
        const earned = new TokenAmount(token, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0))
        const isLockup = isLockupState?.result?.[0] ? isLockupState?.result?.[0] : false

        memo.push({
          stakingRewardAddress: rewardsAddress,
          token: info[index].token,
          earnedAmount: earned,
          totalRewardRate: totalRewardRate,
          stakedAmount: new TokenAmount(vai, JSBI.BigInt(balanceState?.result?.[0] ?? 0)),
          totalStakedAmount: totalStakedAmount,
          currentStakingLimit: stakingLimit,
          isLockup: isLockup
        })
      }
      return memo
    }, [])
  }, [
    balances,
    chainId,
    earnedAmounts,
    info,
    rewardsAddresses,
    totalSupplies,
    vai,
    stakingLimit,
    rewardRates,
    isLockups
  ])
}
